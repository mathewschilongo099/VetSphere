// Manual article generator used by the admin "Write" tab. Admin only (the
// middleware protects every /api route that is not on the public list).
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { generate, extractJson } from '@/lib/ai/client';
import { insertInlineImages } from '@/lib/images/insert';
import { pickArticleImages } from '@/lib/images/pick';
import { detectSubject } from '@/lib/images/subjects';
import { fetchSearchPhrases } from '@/lib/pipeline/seo';

function buildFallbackTags(topic: string): string[] {
  const cleaned = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter((w) => w.length > 3 && !['your', 'this', 'that', 'might', 'could', 'should'].includes(w));

  return Array.from(new Set([topic.toLowerCase(), ...cleaned, 'animal health', 'veterinary'])).slice(0, 6);
}

function cleanContent(content: string): string {
  return content
    .replace(/^# .+?\n/, '') // the page already shows the title
    .replace(/!\[[^\]]*\]\([^)]*\)\s*\n*/g, '') // pictures are added and checked by the site
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeTitle(raw: string): string | null {
  const title = raw
    .split('\n')[0]
    .replace(/^#+\s*/, '')
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/^Title:\s*/i, '')
    .trim();
  if (title.length < 5) return null;
  return title.length > 70 ? title.slice(0, 67).trim() + '...' : title;
}

function fallbackTitle(topic: string): string {
  return topic
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildExcerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = clean.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');
  if (!topic) {
    return NextResponse.json({ error: 'Topic required' }, { status: 400 });
  }

  const startedAt = Date.now();
  const deadlineMs = startedAt + 56000;

  try {
    // 1. Real searches people type (Google autocomplete). Quick and optional.
    const searches = await fetchSearchPhrases(topic, 10);

    // 2. The article.
    const prompt = `You are an expert veterinary SEO writer.

PRIMARY SEARCH PHRASE: ${topic}
REAL SEARCHES PEOPLE TYPE (use the ones that fit as headings and FAQ questions):
${searches.length ? searches.map((q) => `- ${q}`).join('\n') : '(none available)'}

Write a helpful, accurate article of 1,200 to 1,600 words about: "${topic}"

STRUCTURE
- Start with a short opening that uses the search phrase and gets straight to the point.
- Use clear "##" headings. Where it fits, phrase some as questions people search, for example "How is ${topic} treated?".
- Include practical, actionable information. Use bullet lists only where they really help.
- End the main article with a short practical section.
- Then add "## Frequently Asked Questions" with 5 questions, each as a "### Question?" heading followed by a 35 to 70 word answer.

STYLE
- Plain, simple English. Speak to the reader as "you". Short paragraphs (2 to 3 sentences).
- Only state facts you are confident are accurate. Do not invent statistics or studies. Never give drug doses; tell readers to ask a veterinarian.
- No citations, no references section, no pictures, no horizontal lines.

Write only the article content in markdown, with no title heading.`;

    const article = await generate({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 6000,
      timeoutMs: 35000,
      deadlineMs,
      validate: (text) => {
        if (text.trim().length < 1500) throw new Error('article is too short');
      },
    });
    const content = cleanContent(article.text);
    const plainText = content.replace(/[#*![\]()]/g, '').trim();

    // 3. Title and tags, in one quick call. Falls back to plain defaults.
    let seoTitle = fallbackTitle(topic);
    let tags = buildFallbackTags(topic);
    try {
      const meta = await generate({
        system: 'You are an SEO editor for a veterinary website.',
        prompt: `Topic: "${topic}"
Article opening:
"""
${content.slice(0, 700)}
"""
Return ONLY JSON: {"title":"45 to 60 characters, includes the phrase \\"${topic}\\" near the start, plain and specific, no clickbait","tags":["4 to 6 lowercase search keywords"]}`,
        json: true,
        temperature: 0.3,
        maxOutputTokens: 300,
        timeoutMs: 12000,
        deadlineMs,
      });
      const parsed = extractJson<{ title?: string; tags?: string[] }>(meta.text);
      seoTitle = sanitizeTitle(String(parsed.title ?? '')) ?? seoTitle;
      if (Array.isArray(parsed.tags) && parsed.tags.length >= 3) {
        tags = parsed.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6);
      }
    } catch (metaError) {
      console.error('Title step failed, using defaults:', metaError);
    }

    // 4. Pictures: found for the right animal and checked by an AI.
    const subject = detectSubject({ title: `${topic} ${seoTitle}`, tags, body: content });
    const pictures = await pickArticleImages({
      subject,
      topic,
      inlineCount: 2,
      deadlineMs: deadlineMs - 1000,
      seed: new Date().getUTCMinutes(),
    });
    const contentWithImages = insertInlineImages(content, pictures.inline);

    return NextResponse.json({
      content: contentWithImages,
      title: seoTitle,
      excerpt: buildExcerpt(plainText, 155),
      metaDescription: buildExcerpt(plainText, 158),
      tags,
      heroImage: pictures.hero?.url ?? '',
      heroAlt: pictures.hero?.alt ?? '',
      seo: { primary_keyword: topic, questions: searches },
      provider: article.provider,
      usedFallback: article.provider !== 'gemini',
      pictureLog: pictures.log,
      warning: pictures.hero ? undefined : `No checked picture of ${subject.label} was found. Add one from the Media tab before publishing.`,
    });
  } catch (error) {
    console.error('Generate route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
