// Stage 4 of 4: final checks (duplicates, an independent fact-check by a second
// model call), pick checked photos, then publish. Add ?dryRun=1 to run every
// check without publishing anything.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import { checkDraft, findDuplicate, normalizeDraft, slugify, wordCount } from '@/lib/pipeline/gate';
import { createArticleFile, listExistingArticles, triggerDeployHook } from '@/lib/pipeline/github';
import { JUDGE_SYSTEM, buildJudgePrompt, type Research } from '@/lib/pipeline/prompts';
import { detectSubject } from '@/lib/images/subjects';
import { pickArticleImages, type ArticleImages } from '@/lib/images/pick';
import { insertUnderHeadings, sectionHeadings } from '@/lib/images/insert';

// Picture checking must be finished by this point (the function stops at 60 s).
const IMAGE_DEADLINE_MS = 46000;

function isResearch(value: unknown): value is Research {
  const v = value as Research;
  return !!v && typeof v.topic === 'string' && Array.isArray(v.facts) && Array.isArray(v.sources);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
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

    // Start choosing photos now so it runs while the fact-check is running.
    const subject = detectSubject({ title: draft.title, tags: draft.tags, body: draft.body });
    const imagesPromise: Promise<ArticleImages> = pickArticleImages({
      subject,
      topic: research.topic,
      headings: sectionHeadings(draft.body, 3),
      deadlineMs: startedAt + IMAGE_DEADLINE_MS,
    }).catch(() => ({ hero: null, sections: new Map(), log: ['picture search failed'] }));

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

    // 4. Photos. An article is not published without a checked lead picture.
    const images = await imagesPromise;
    if (!images.hero) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `No checked picture of ${subject.label} was found, so nothing was published. ${images.log.slice(-3).join(' | ')}`.trim(),
      });
    }

    // 5. Build the file.
    const slug = slugify(draft.title);
    const date = new Date().toISOString().slice(0, 10);
    const bodyWithImages = insertUnderHeadings(draft.body, images.sections);

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
image: ${JSON.stringify(images.hero.url)}
imageAlt: ${JSON.stringify(images.hero.alt)}
featured: false
excerpt: ${JSON.stringify(draft.description)}
---

${bodyWithImages}

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
        imageNotes: images.log,
        preview: markdown,
      });
    }

    // 6. Publish.
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
