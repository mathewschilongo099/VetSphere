// Manual article writer used by the admin page. It no longer writes from the
// model's memory: it researches the topic on the live web first, writes from
// the facts it found, runs the same quality checks as the automatic pipeline,
// adds matching photos (one at the top, one under each subheading) and a
// Sources section with the real links.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson, GeminiError, publicGeminiMessage } from '@/lib/pipeline/gemini';
import { checkDraft, normalizeDraft, wordCount, type Draft } from '@/lib/pipeline/gate';
import { researchTopic } from '@/lib/pipeline/research';
import { WRITER_GUIDE_SYSTEM, buildWritePrompt, type TopicChoice } from '@/lib/pipeline/prompts';

const MAX_TOPIC_LENGTH = 200;
// The function is stopped at 120 s, so every step works inside this budget.
const TOTAL_BUDGET_MS = 115000;

// ---------------------------------------------------------------- images

async function searchImages(query: string): Promise<string[]> {
  const pexels = process.env.PEXELS_API_KEY;
  if (pexels) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: pexels }, cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        const urls: string[] = (data.photos ?? []).map((p: any) => p?.src?.large).filter(Boolean);
        if (urls.length) return urls;
      }
    } catch {}
  }
  const unsplash = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplash) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplash}` }, cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        const urls: string[] = (data.results ?? []).map((r: any) => r?.urls?.regular).filter(Boolean);
        if (urls.length) return urls;
      }
    } catch {}
  }
  return [];
}

const ANIMALS: Array<[RegExp, string]> = [
  [/\b(dairy|milk|mastitis|calf|calves|cow|cows|cattle|bovine|beef)\b/i, 'cattle'],
  [/\b(poultry|chicken|chickens|broiler|layer|hen|hens|newcastle|avian|duck|turkey)\b/i, 'chickens'],
  [/\b(goat|goats)\b/i, 'goats'],
  [/\b(sheep|lamb|lambs|ewe|ewes)\b/i, 'sheep'],
  [/\b(pig|pigs|swine|piglet|piglets)\b/i, 'pigs'],
];

function animalFor(text: string): string {
  for (const [re, name] of ANIMALS) if (re.test(text)) return name;
  return 'livestock';
}

// A photo search phrase that fits what the section is about.
function sectionQuery(heading: string, animal: string): string {
  if (/sign|symptom|spot|look for|recogni/i.test(heading)) return `sick ${animal}`;
  if (/treat|vet|care for/i.test(heading)) return `veterinarian examining ${animal}`;
  if (/prevent|vaccin|biosecurity|protect/i.test(heading)) return `vaccinating ${animal}`;
  if (/feed|nutrition|diet/i.test(heading)) return `${animal} feeding`;
  if (/hous|shed|barn|pen|ventilat/i.test(heading)) return `${animal} barn`;
  if (/water/i.test(heading)) return `${animal} drinking water`;
  return `${animal} farm`;
}

// One matching photo under each "##" heading. If no photo is found, none is added:
// a missing picture is better than a wrong one.
async function addSectionImages(body: string, animal: string, used: Set<string>): Promise<string> {
  const headings = Array.from(body.matchAll(/^##\s+(.+?)\s*$/gm))
    .map((m) => m[1].replace(/[*_`]/g, ''))
    .slice(0, 5);
  if (headings.length === 0) return body;

  const lists = await Promise.all(
    headings.map(async (h) => {
      const found = await searchImages(sectionQuery(h, animal));
      return found.length ? found : searchImages(`${animal} farm`);
    })
  );

  const picked = new Map<string, string>();
  headings.forEach((h, i) => {
    const url = lists[i].find((u) => !used.has(u));
    if (url) {
      used.add(url);
      picked.set(h, url);
    }
  });

  return body
    .split('\n')
    .flatMap((line) => {
      const m = line.match(/^##\s+(.+?)\s*$/);
      if (!m) return [line];
      const clean = m[1].replace(/[*_`]/g, '');
      const url = picked.get(clean);
      if (!url) return [line];
      picked.delete(clean);
      return [line, '', `![${clean.replace(/[\[\]]/g, '')}](${url})`, ''];
    })
    .join('\n');
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
      angle: 'A specific, practical guide for farmers and students built on what reliable sources say',
      whyNow: 'Chosen by the editor',
      headlines: [],
    };

    // 1. Research the topic on the live web. No sources, no article.
    const outcome = await researchTopic(topic, 55000);
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

    // 2. Write the guide, then run the quality checks (up to 3 tries).
    let feedback: string[] | undefined;
    let issues: string[] = [];
    let draft: Draft | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      if (left() < 20000) break;
      const result = await callGemini({
        system: WRITER_GUIDE_SYSTEM,
        prompt: buildWritePrompt(research, feedback),
        json: true,
        temperature: 0.85,
        maxOutputTokens: 6000,
        timeoutMs: Math.min(left() - 5000, 45000),
      });
      const candidate = normalizeDraft(extractJson(result.text));
      const gate = checkDraft(candidate, researchText);
      if (gate.passed) {
        draft = candidate;
        issues = [];
        break;
      }
      issues = gate.issues;
      feedback = gate.issues.some((i) => i.includes('too short'))
        ? [
            ...gate.issues,
            'Expand the article to about 1,100 words: 5 to 6 sections of 3 to 4 paragraphs each, with practical detail a farmer can use. Do not add numbers that are not in the research.',
          ]
        : gate.issues;
    }

    if (!draft) {
      return NextResponse.json(
        {
          error: `The draft did not pass the quality checks, so nothing was returned: ${issues.join('; ') || 'ran out of time'}. Please try again.`,
        },
        { status: 422 }
      );
    }

    // 3. Matching photos: one at the top, one under each subheading, plus sources.
    const animal = animalFor(`${topicText} ${draft.title}`);
    const used = new Set<string>();
    const heroList = await searchImages(`${animal} farm`);
    const heroImage = heroList[0] ?? '';
    if (heroImage) used.add(heroImage);
    const bodyWithImages = await addSectionImages(draft.body, animal, used);
    const content = `${bodyWithImages}${sourcesSection(research.sources)}`;

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
