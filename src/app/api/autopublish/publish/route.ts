// Stage 4 of 4: final checks, then publish.
//  - quality checks and duplicate check
//  - an independent fact-check (a second AI call)
//  - pictures: found for the right animal and looked at by an AI, in parallel
// Nothing is published unless the text AND the lead picture pass. Add
// ?dryRun=1 to run every check without publishing anything.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { generate, extractJson } from '@/lib/ai/client';
import { checkDraft, findDuplicate, normalizeDraft, slugify, wordCount } from '@/lib/pipeline/gate';
import { createArticleFile, listExistingArticles, triggerDeployHook } from '@/lib/pipeline/github';
import { JUDGE_SYSTEM, buildJudgePrompt, type Research } from '@/lib/pipeline/prompts';
import { checkBodyImages, insertInlineImages } from '@/lib/images/insert';
import { pickArticleImages } from '@/lib/images/pick';
import { detectSubject } from '@/lib/images/subjects';

function isResearch(value: unknown): value is Research {
  const v = value as Research;
  return !!v && typeof v.topic === 'string' && Array.isArray(v.facts) && Array.isArray(v.sources);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const deadlineMs = startedAt + 56000;
  try {
    const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
    const body = await request.json().catch(() => null);
    if (!isResearch(body?.research) || !body?.draft) {
      return NextResponse.json({ ok: false, error: 'Research and draft are required' }, { status: 400 });
    }
    const research: Research = body.research;
    const draft = normalizeDraft(body.draft);

    // 1. Re-run the cheap checks; never trust what arrives over the wire.
    const gate = checkDraft(draft, JSON.stringify(research), { keyword: research.keyword });
    if (!gate.passed) {
      return NextResponse.json({ ok: false, skipped: true, reason: `Quality checks failed: ${gate.issues.join('; ')}` });
    }

    // 2. Duplicate check against what is already on the site.
    const existing = await listExistingArticles();
    const duplicate = findDuplicate(draft.title, existing);
    if (duplicate) {
      return NextResponse.json({ ok: false, skipped: true, reason: `Too similar to the existing article "${duplicate}".` });
    }

    // 3. Fact-check and pictures at the same time.
    const subject = detectSubject({ title: draft.title, tags: draft.tags, body: draft.body });
    const [judged, pictures] = await Promise.all([
      generate({
        system: JUDGE_SYSTEM,
        prompt: buildJudgePrompt(research, draft.title, draft.body),
        json: true,
        temperature: 0,
        maxOutputTokens: 1500,
        timeoutMs: 28000,
        deadlineMs,
      }),
      pickArticleImages({
        subject,
        topic: research.topic,
        inlineCount: 2,
        deadlineMs: deadlineMs - 2000,
        seed: new Date().getUTCDate() + new Date().getUTCHours(),
      }),
    ]);

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

    // 4. A verified lead picture is required.
    if (!pictures.hero) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `No picture of ${subject.label} passed the picture check, so the article was not published. ${pictures.log.slice(-3).join(' | ')}`.trim(),
      });
    }

    const bodyWithImages = insertInlineImages(draft.body, pictures.inline);
    const imageIssues = checkBodyImages(bodyWithImages);
    if (imageIssues.length > 0) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Picture checks failed: ${imageIssues.map((i) => i.problem).join('; ')}`,
      });
    }

    // 5. Build the file.
    const slug = slugify(research.keyword && research.keyword.length >= 8 ? research.keyword : draft.title);
    const finalSlug = existing.some((a) => a.slug === slug) ? slugify(draft.title) : slug;
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
image: ${JSON.stringify(pictures.hero.url)}
imageAlt: ${JSON.stringify(pictures.hero.alt)}
featured: false
excerpt: ${JSON.stringify(draft.description)}
---

${insertSourcesBeforeFaq(bodyWithImages, sourcesList)}
`;

    const summary = {
      title: draft.title,
      slug: finalSlug,
      words: wordCount(draft.body),
      score: verdict.score,
      keyword: research.keyword,
      images: [pictures.hero, ...pictures.inline].map((i) => ({ url: i.url, alt: i.alt, verified: i.verified })),
      pictureLog: pictures.log,
      factCheckedBy: judged.provider,
    };

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        ...summary,
        toneProblems: verdict.tone_problems ?? [],
        preview: markdown,
      });
    }

    // 6. Publish.
    await createArticleFile(finalSlug, markdown, `Auto-publish: ${draft.title}`);
    await triggerDeployHook();

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error('autopublish/publish failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Publish stage failed' },
      { status: 500 }
    );
  }
}

/** The sources list goes just before the FAQ, which stays last in the file. */
function insertSourcesBeforeFaq(body: string, sourcesList: string): string {
  const lines = body.split('\n');
  const faqAt = lines.findIndex((l) => /^##\s*frequently asked questions\b/i.test(l.trim()));
  const sources = `## Sources\n\n${sourcesList}`;
  if (faqAt === -1) return `${body}\n\n${sources}`;
  return `${lines.slice(0, faqAt).join('\n').trimEnd()}\n\n${sources}\n\n${lines.slice(faqAt).join('\n')}`;
}
