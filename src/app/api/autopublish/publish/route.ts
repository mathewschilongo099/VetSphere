// Stage 4 of 4: final checks (duplicates, an independent fact-check by a second
// model call), pick checked photos, then publish. Add ?dryRun=1 to run every
// check without publishing anything.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import {
  checkDraft,
  findDuplicate,
  isHarmlessClaim,
  normalizeDraft,
  removeClaims,
  slugify,
  wordCount,
  type Draft,
} from '@/lib/pipeline/gate';
import { createArticleFile, listExistingArticles, triggerDeployHook } from '@/lib/pipeline/github';
import { JUDGE_SYSTEM, buildJudgePrompt, type Research } from '@/lib/pipeline/prompts';
import { detectSubject } from '@/lib/images/subjects';
import { pickArticleImages, type ArticleImages } from '@/lib/images/pick';
import { insertUnderHeadings, sectionHeadings } from '@/lib/images/insert';

// Picture checking must be finished by this point (the function stops at 60 s).
const IMAGE_DEADLINE_MS = 46000;

// Lowest fact-check score (1 to 10) that can be published.
const MIN_SCORE = 6;

interface Verdict {
  faithful?: boolean;
  unsupported_claims?: string[];
  tone_problems?: string[];
  score?: number;
}

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
    const researchText = JSON.stringify(research);
    let draft: Draft = normalizeDraft(body.draft);

    // 1. Re-run the cheap checks; never trust what arrives over the wire.
    const gate = checkDraft(draft, researchText);
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

    // 3. Independent fact-check, with one retry. If it cannot run at all we do
    // NOT publish, because nothing has checked the article.
    let verdict: Verdict | null = null;
    let judgeError = '';
    for (let attempt = 1; attempt <= 2 && !verdict; attempt++) {
      if (attempt > 1 && Date.now() - startedAt > 34000) break;
      try {
        const judged = await callGemini({
          system: JUDGE_SYSTEM,
          prompt: buildJudgePrompt(research, draft.title, draft.body),
          json: true,
          temperature: 0,
          maxOutputTokens: 1500,
          timeoutMs: attempt === 1 ? 26000 : 18000,
        });
        verdict = extractJson<Verdict>(judged.text);
      } catch (error) {
        judgeError = error instanceof Error ? error.message : String(error);
      }
    }
    if (!verdict) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `The fact-check could not run (${judgeError || 'no answer'}), so nothing was published. Run it again.`,
      });
    }

    // Advice to ask a vet is something the writer is told to include, so it is
    // never a reason to reject. Real unsupported claims are cut out of the text
    // instead of throwing the whole article away.
    const score = typeof verdict.score === 'number' ? verdict.score : MIN_SCORE + 1;
    const claims = (verdict.unsupported_claims ?? []).filter((c) => !isHarmlessClaim(c));
    let removedClaims = 0;
    if (claims.length > 0) {
      const cleaned = removeClaims(draft.body, claims);
      const recheck = checkDraft({ ...draft, body: cleaned.body }, researchText);
      if (cleaned.removed === 0 || !recheck.passed) {
        return NextResponse.json({
          ok: false,
          skipped: true,
          reason: `Fact-check found claims the research does not support (${claims.slice(0, 3).join(' | ')}) and they could not be removed cleanly${
            recheck.passed ? '' : `: ${recheck.issues.join('; ')}`
          }.`,
        });
      }
      draft = { ...draft, body: cleaned.body };
      removedClaims = cleaned.removed;
    }
    if (score < MIN_SCORE) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Fact-check score ${score} is below ${MIN_SCORE}. ${(verdict.tone_problems ?? []).slice(0, 3).join(' | ')}`.trim(),
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
    let bodyWithImages = draft.body;
    try {
      bodyWithImages = insertUnderHeadings(draft.body, images.sections);
    } catch {
      bodyWithImages = draft.body;
    }

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
        score,
        removedClaims,
        toneProblems: verdict.tone_problems ?? [],
        imageNotes: images.log,
        preview: markdown,
      });
    }

    // 6. Publish.
    await createArticleFile(slug, markdown, `Auto-publish: ${draft.title}`);
    await triggerDeployHook();

    return NextResponse.json({ ok: true, title: draft.title, slug, words: wordCount(draft.body), score, removedClaims });
  } catch (error) {
    console.error('autopublish/publish failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Publish stage failed' },
      { status: 500 }
    );
  }
}
