// Manual article writer used by the admin page. It researches the topic on the
// live web first, writes a guide from the facts it found, runs the same quality
// checks as the automatic pipeline, adds checked photos (one at the top and one
// under each subheading) and a Sources section with the real links.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson, GeminiError, publicGeminiMessage } from '@/lib/pipeline/gemini';
import { checkDraft, normalizeDraft, wordCount, type Draft } from '@/lib/pipeline/gate';
import { researchTopic } from '@/lib/pipeline/research';
import { WRITER_GUIDE_SYSTEM, buildWritePrompt, type TopicChoice } from '@/lib/pipeline/prompts';
import { detectSubject } from '@/lib/images/subjects';
import { pickArticleImages } from '@/lib/images/pick';
import { insertUnderHeadings, sectionHeadings } from '@/lib/images/insert';

const MAX_TOPIC_LENGTH = 200;
// The function is stopped at 120 s, so every step works inside this budget.
const TOTAL_BUDGET_MS = 115000;
// Picture checking must be finished by this point.
const IMAGE_DEADLINE_MS = 105000;

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

    // 3. Checked photos: one at the top, one under each of the first 4 subheadings.
    //    Each photo is searched by animal and section, then looked at by Gemini.
    //    No match means no photo, never a wrong one.
    const subject = detectSubject({ title: draft.title, tags: draft.tags, body: draft.body });
    const images = await pickArticleImages({
      subject,
      topic: topicText,
      headings: sectionHeadings(draft.body, 4),
      deadlineMs: startedAt + IMAGE_DEADLINE_MS,
    }).catch(() => ({ hero: null, sections: new Map(), log: ['picture search failed'] as string[] }));

    const content = `${insertUnderHeadings(draft.body, images.sections)}${sourcesSection(research.sources)}`;

    return NextResponse.json({
      content,
      title: draft.title,
      excerpt: draft.description,
      metaDescription: draft.description,
      tags: draft.tags,
      category: draft.category,
      heroImage: images.hero?.url ?? '',
      heroImageAlt: images.hero?.alt ?? '',
      imageNotes: images.log,
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
