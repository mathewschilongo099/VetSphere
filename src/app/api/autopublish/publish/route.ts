// Stage 4 of 4: final checks (duplicates, an independent fact-check by a second
// model call), pick a matching photo, then publish. Add ?dryRun=1 to run
// every check without publishing anything.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import { checkDraft, findDuplicate, normalizeDraft, slugify, wordCount } from '@/lib/pipeline/gate';
import { createArticleFile, listExistingArticles, triggerDeployHook } from '@/lib/pipeline/github';
import { JUDGE_SYSTEM, buildJudgePrompt, type Research } from '@/lib/pipeline/prompts';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/18351958/pexels-photo-18351958/free-photo-of-a-cow-standing-in-a-field-next-to-a-tree.jpeg?w=800&h=400&fit=crop';

function isResearch(value: unknown): value is Research {
  const v = value as Research;
  return !!v && typeof v.topic === 'string' && Array.isArray(v.facts) && Array.isArray(v.sources);
}

function imageQuery(topic: string): string {
  const t = topic.toLowerCase();
  if (/(poultry|chicken|avian|bird|newcastle|egg)/.test(t)) return 'chickens farm';
  if (/(dairy|milk|mastitis)/.test(t)) return 'dairy cows farm';
  if (/(cattle|cow|bovine|beef|lumpy|foot-and-mouth|fmd)/.test(t)) return 'cattle farm';
  if (/(goat|ppr|peste)/.test(t)) return 'goats farm';
  if (/(sheep|lamb)/.test(t)) return 'sheep flock farm';
  if (/(pig|swine|hog)/.test(t)) return 'pigs farm';
  return 'livestock farm';
}

async function pickImage(topic: string): Promise<{ url: string; alt: string }> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return { url: FALLBACK_IMAGE, alt: topic };
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(imageQuery(topic))}&per_page=15&orientation=landscape`,
      { headers: { Authorization: key }, cache: 'no-store' }
    );
    if (!res.ok) return { url: FALLBACK_IMAGE, alt: topic };
    const data = await res.json();
    const photos: Array<{ src?: { large?: string }; alt?: string; width?: number; height?: number }> =
      data?.photos ?? [];
    // Rotate through the top results by day so consecutive articles do not share a photo.
    const usable = photos.filter((p) => p.src?.large && (p.width ?? 1) >= (p.height ?? 0));
    const pick = usable[new Date().getUTCDate() % Math.max(usable.length, 1)];
    if (!pick?.src?.large) return { url: FALLBACK_IMAGE, alt: topic };
    return { url: pick.src.large, alt: (pick.alt || topic).slice(0, 140) };
  } catch {
    return { url: FALLBACK_IMAGE, alt: topic };
  }
}

export async function POST(request: NextRequest) {
  try {
    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const body = await request.json().catch(() => null);
    if (!isResearch(body?.research) || !body?.draft) {
      return NextResponse.json({ ok: false, error: 'Research and draft are required' }, { status: 400 });
    }
    const research: Research = body.research;
    const draft = normalizeDraft(body.draft);

    // 1. Re-run the cheap checks; never trust what arrives over the wire.
    const gate = checkDraft(draft, JSON.stringify(research));
    if (!gate.passed) {
      return NextResponse.json({ ok: false, skipped: true, reason: `Quality checks failed: ${gate.issues.join('; ')}` });
    }

    // 2. Duplicate check against what is already on the site.
    const existing = await listExistingArticles();
    const duplicate = findDuplicate(draft.title, existing);
    if (duplicate) {
      return NextResponse.json({ ok: false, skipped: true, reason: `Too similar to the existing article "${duplicate}".` });
    }

    // 3. Independent fact-check. If this call fails we do NOT publish.
    const judged = await callGemini({
      system: JUDGE_SYSTEM,
      prompt: buildJudgePrompt(research, draft.title, draft.body),
      json: true,
      temperature: 0,
      maxOutputTokens: 1500,
      timeoutMs: 30000,
    });
    const verdict = extractJson<{
      faithful?: boolean;
      unsupported_claims?: string[];
      tone_problems?: string[];
      score?: number;
    }>(judged.text);

    const unsupported = verdict.unsupported_claims ?? [];
    if (verdict.faithful !== true || unsupported.length > 0 || (verdict.score ?? 0) < 7) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Fact-check rejected the draft (score ${verdict.score ?? '?'}). ${unsupported.slice(0, 3).join(' | ')}`.trim(),
      });
    }

    // 4. Build the file.
    const image = await pickImage(research.topic);
    const slug = slugify(draft.title);
    const date = new Date().toISOString().slice(0, 10);

    const sourcesList = research.sources
      .map((s) => `- [${s.title.replace(/[\[\]]/g, '')}](${s.url})`)
      .join('\n');

    const markdown = `---
title: ${JSON.stringify(draft.title)}
description: ${JSON.stringify(draft.description)}
date: ${JSON.stringify(date)}
author: "VetSphere"
category: ${JSON.stringify(draft.category)}
tags: ${JSON.stringify(draft.tags)}
image: ${JSON.stringify(image.url)}
imageAlt: ${JSON.stringify(image.alt)}
featured: false
excerpt: ${JSON.stringify(draft.description)}
---

${draft.body}

## Sources

${sourcesList}
`;

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        title: draft.title,
        slug,
        words: wordCount(draft.body),
        score: verdict.score,
        toneProblems: verdict.tone_problems ?? [],
        preview: markdown,
      });
    }

    // 5. Publish.
    await createArticleFile(slug, markdown, `Auto-publish: ${draft.title}`);
    await triggerDeployHook();

    return NextResponse.json({ ok: true, title: draft.title, slug, words: wordCount(draft.body), score: verdict.score });
  } catch (error) {
    console.error('autopublish/publish failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Publish stage failed' },
      { status: 500 }
    );
  }
}
