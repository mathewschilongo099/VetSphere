// Manual article writer used by the admin page. It no longer writes from the
// model's memory: it researches the topic on the live web first, writes only from
// the facts it found, runs the same quality checks as the automatic pipeline, and
// adds a Sources section with the real links.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson, GeminiError, publicGeminiMessage } from '@/lib/pipeline/gemini';
import { checkDraft, normalizeDraft, wordCount, type Draft } from '@/lib/pipeline/gate';
import { researchTopic } from '@/lib/pipeline/research';
import { WRITER_SYSTEM, buildWritePrompt, type TopicChoice } from '@/lib/pipeline/prompts';

const MAX_TOPIC_LENGTH = 200;
// Vercel stops the function at 60 s, so every step works inside this budget.
const TOTAL_BUDGET_MS = 57000;

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/18351958/pexels-photo-18351958/free-photo-of-a-cow-standing-in-a-field-next-to-a-tree.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351948/pexels-photo-18351948/free-photo-of-a-group-of-chickens-in-a-pen.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351947/pexels-photo-18351947/free-photo-of-a-goat-standing-in-a-field.jpeg?w=800&h=400&fit=crop',
];

function randomFallback(): string {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

async function getPexelsImage(query: string): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape`,
      { headers: { Authorization: key }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photos: Array<{ src?: { large?: string } }> = data.photos || [];
    const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
    return pick?.src?.large ?? null;
  } catch {
    return null;
  }
}

async function getUnsplashImage(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: Array<{ urls?: { regular?: string } }> = data.results || [];
    const pick = results[Math.floor(Math.random() * Math.min(results.length, 5))];
    return pick?.urls?.regular ?? null;
  } catch {
    return null;
  }
}

async function getArticleImage(query: string): Promise<string> {
  return (await getPexelsImage(query)) ?? (await getUnsplashImage(query)) ?? randomFallback();
}

// A plain photo search phrase based on what the article is about.
function imageQuery(category: string): string {
  switch (category) {
    case 'Cattle':
      return 'cattle farm';
    case 'Dairy Farming':
      return 'dairy cows farm';
    case 'Goats & Sheep':
      return 'goats sheep farm';
    case 'Poultry':
      return 'chickens farm';
    case 'Pig Farming':
      return 'pigs farm';
    default:
      return 'livestock farm';
  }
}

function sourcesSection(sources: Array<{ title: string; url: string }>): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const s of sources) {
    if (!s.url || seen.has(s.url)) continue;
    seen.add(s.url);
    lines.push(`- [${s.title.replace(/[\[\]]/g, '')}](${s.url})`);
  }
  return lines.length ? `\n\n## Sources\n\n${lines.join('\n')}\n` : '';
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const left = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);
  const topicText = request.nextUrl.searchParams.get('topic')?.trim();

  if (!topicText) {
    return NextResponse.json({ error: 'Topic required' }, { status: 400 });
  }
  if (topicText.length > MAX_TOPIC_LENGTH) {
    return NextResponse.json(
      { error: `Topic is too long (maximum ${MAX_TOPIC_LENGTH} characters)` },
      { status: 400 }
    );
  }

  try {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const topic: TopicChoice = {
      topic: topicText,
      angle: 'A specific, practical article for farmers built only from what the sources say',
      whyNow: 'Chosen by the editor',
      headlines: [],
    };

    // 1. Research the topic on the live web. No sources, no article.
    const outcome = await researchTopic(topic, 28000);
    if (!outcome.ok) {
      return NextResponse.json(
        {
          error: `${outcome.reason} Try a more specific topic, for example a named disease or event and a country.`,
        },
        { status: 422 }
      );
    }
    const research = outcome.research;
    const researchText = JSON.stringify(research);

    // 2. Write only from the research, then run the quality checks.
    let feedback: string[] | undefined;
    let issues: string[] = [];
    let draft: Draft | null = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      if (left() < 15000) break;
      const result = await callGemini({
        system: WRITER_SYSTEM,
        prompt: buildWritePrompt(research, feedback),
        json: true,
        temperature: 0.85,
        maxOutputTokens: 6000,
        timeoutMs: Math.min(left() - 3000, 35000),
      });
      const candidate = normalizeDraft(extractJson(result.text));
      const gate = checkDraft(candidate, researchText);
      if (gate.passed) {
        draft = candidate;
        issues = [];
        break;
      }
      issues = gate.issues;
      feedback = gate.issues;
    }

    if (!draft) {
      return NextResponse.json(
        {
          error: `The draft did not pass the quality checks, so nothing was returned: ${issues.join('; ') || 'ran out of time'}. Please try again.`,
        },
        { status: 422 }
      );
    }

    // 3. Add the real sources and a matching photo.
    const content = `${draft.body}${sourcesSection(research.sources)}`;
    const heroImage = await getArticleImage(imageQuery(draft.category));

    return NextResponse.json({
      content,
      title: draft.title,
      excerpt: draft.description,
      metaDescription: draft.description,
      tags: draft.tags,
      category: draft.category,
      heroImage,
      sources: research.sources,
      unknowns: research.unknowns,
      words: wordCount(draft.body),
      seo: {
        primary_keyword: topicText,
        secondary_keywords: draft.tags,
        long_tail_keywords: [],
        search_intent: 'informational',
        questions: [],
      },
      usedFallback: false,
    });
  } catch (error) {
    console.error(
      'Generate route failed:',
      error instanceof GeminiError ? `${error.kind} (${error.status ?? 'n/a'})` : error instanceof Error ? error.message : 'unknown'
    );
    const status = error instanceof GeminiError && error.kind === 'rate_limited' ? 429 : 500;
    return NextResponse.json({ error: publicGeminiMessage(error) }, { status });
  }
}
