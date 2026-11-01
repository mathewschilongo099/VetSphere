// Rewrites an article from a web page in VetSphere's own words. Admin only.
// Uses the shared AI client (every provider is tried in turn) and the same
// checked-picture finder as the other generators.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { AllProvidersFailed, generate, extractJson } from '@/lib/ai/client';
import { insertInlineImages } from '@/lib/images/insert';
import { pickArticleImages } from '@/lib/images/pick';
import { detectSubject } from '@/lib/images/subjects';

// Only public http(s) pages may be fetched. This blocks requests to localhost,
// private networks and cloud metadata addresses (server-side request forgery).
function isSafePublicUrl(raw: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password) return null;

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return null;
  }
  // IPv6 literals (including loopback / link-local) are not needed for article URLs.
  if (host.startsWith('[') || host.includes(':')) return null;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    ) {
      return null;
    }
  }
  return parsed;
}

function buildExcerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function cleanContent(content: string): string {
  return content
    .replace(/```markdown/g, '')
    .replace(/```/g, '')
    .replace(/^# .+?\n/, '') // the page already shows the title
    .replace(/!\[[^\]]*\]\([^)]*\)\s*\n*/g, '') // pictures are added and checked by the site
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanTitle(raw: string): string {
  const title = raw
    .split('\n')[0]
    .replace(/^#+\s*/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/^Title:\s*/i, '')
    .replace(/\s+[|–—-]\s+[^|–—-]{2,40}$/, '') // site name after the title
    .replace(/\s+/g, ' ')
    .trim();
  return title.length > 70 ? title.slice(0, 67).trim() + '...' : title;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const deadlineMs = startedAt + 57000;
  try {
    let body: { url?: unknown; topic?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const url = body.url;
    const topic = typeof body.topic === 'string' ? body.topic.slice(0, 200) : undefined;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const safeUrl = isSafePublicUrl(url);
    if (!safeUrl) {
      return NextResponse.json(
        { error: 'Please provide a public http(s) article URL.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 12000);
    let response: Response;
    try {
      response = await fetch(safeUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VetSphereBot/1.0)',
        },
        // Do not follow redirects automatically: a redirect could point at an internal address.
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch {
      return NextResponse.json({ error: 'Could not fetch that URL.' }, { status: 502 });
    } finally {
      clearTimeout(fetchTimer);
    }

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json(
        { error: 'That URL redirects elsewhere. Please paste the final article URL.' },
        { status: 400 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : topic || 'Article';

    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    if (textContent.length < 200) {
      return NextResponse.json(
        { error: 'Could not extract enough content from the URL. Please try a different article.' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert veterinary SEO writer and content creator. Based on the following source content, create a NEW, ORIGINAL, and COMPLETELY REWRITTEN blog post.

Source Title: ${extractedTitle}
Source Content:
${textContent}

STRUCTURE
- Start with a short opening that gets straight to the point.
- Use clear "##" headings that make sense for the topic. Where it fits, phrase some as questions people search.
- Include practical, actionable information. Use bullet lists only where they really help.
- End the main article with a short practical section.
- Then add "## Frequently Asked Questions" with 5 questions, each as a "### Question?" heading followed by a 35 to 70 word answer.

STYLE
- Plain, simple English. Speak to the reader as "you". Short paragraphs (2 to 3 sentences).
- Only use facts that appear in the source content; do not invent statistics, studies, drug doses or references.
- Treatment information is general education only, not a diagnosis; tell readers to consult a qualified veterinarian or animal health professional for a sick animal.
- Do NOT copy sentences from the source. Rewrite everything in your own words.
- No citations, no references section, no pictures, no horizontal lines.

Write only the article content in markdown, with no title heading.`;

    const article = await generate({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 6000,
      timeoutMs: 30000,
      deadlineMs: deadlineMs - 14000,
      validate: (text) => {
        if (text.trim().length < 1200) throw new Error('article is too short');
      },
    });
    const content = cleanContent(article.text);
    const plainText = content.replace(/[#*![\]()]/g, '').trim();

    // A clean, original title (not the source page's own title).
    let seoTitle = cleanTitle(extractedTitle) || 'Veterinary article';
    try {
      const meta = await generate({
        system: 'You are an SEO editor for a veterinary website.',
        prompt: `Write a new title for this article. 45 to 60 characters, plain and specific, no clickbait, not copied from "${extractedTitle}".
Article opening:
"""
${content.slice(0, 600)}
"""
Return ONLY JSON: {"title":"..."}`,
        json: true,
        temperature: 0.3,
        maxOutputTokens: 200,
        timeoutMs: 10000,
        deadlineMs: deadlineMs - 8000,
      });
      const parsed = extractJson<{ title?: string }>(meta.text);
      const cleaned = cleanTitle(String(parsed.title ?? ''));
      if (cleaned.length >= 10) seoTitle = cleaned;
    } catch (titleError) {
      console.error('Title step failed, using the page title:', titleError instanceof Error ? titleError.message : 'unknown');
    }

    // Pictures: found for the right animal and checked by an AI.
    const subject = detectSubject({ title: `${seoTitle} ${extractedTitle}`, tags: [], body: content });
    const pictures = await pickArticleImages({
      subject,
      topic: seoTitle,
      inlineCount: 2,
      deadlineMs: deadlineMs - 1000,
      seed: new Date().getUTCMinutes(),
    });
    const contentWithImages = insertInlineImages(content, pictures.inline);

    return NextResponse.json({
      success: true,
      title: seoTitle,
      content: contentWithImages,
      metaDescription: buildExcerpt(plainText, 158),
      heroImage: pictures.hero?.url ?? '',
      heroAlt: pictures.hero?.alt ?? '',
      sourceUrl: url,
      sourceTitle: extractedTitle,
      provider: article.provider,
      pictureLog: pictures.log,
      warning: pictures.hero ? undefined : `No checked picture of ${subject.label} was found. Add one from the Media tab before publishing.`,
    });
  } catch (error) {
    console.error('Error rewriting from URL:', error instanceof Error ? error.message : 'unknown');
    if (error instanceof AllProvidersFailed) {
      return NextResponse.json(
        { error: 'Every AI service is busy or unavailable right now. Please try again in a minute.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 });
  }
}
