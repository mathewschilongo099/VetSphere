// Stage 3 of 4: write the article from the fact sheet, then run the strict
// quality checks. Up to two automatic rewrites are allowed if a draft fails.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import { checkDraft, normalizeDraft, researchFigures, wordCount, type Draft } from '@/lib/pipeline/gate';
import { WRITER_SYSTEM, buildWritePrompt, type Research } from '@/lib/pipeline/prompts';

function isResearch(value: unknown): value is Research {
  const v = value as Research;
  return !!v && typeof v.topic === 'string' && Array.isArray(v.facts) && Array.isArray(v.sources);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => null);
    if (!isResearch(body?.research)) {
      return NextResponse.json({ ok: false, error: 'Research from the research stage is required' }, { status: 400 });
    }
    const research: Research = body.research;
    const researchText = JSON.stringify(research);

    let feedback: string[] | undefined;
    let lastIssues: string[] = [];
    let draft: Draft | null = null;
    let previousBody = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      // Do not start another attempt unless enough of the time budget is left.
      const elapsed = Date.now() - startedAt;
      if (attempt > 1 && 57000 - elapsed < 14000) break;

      const result = await callGemini({
        system: WRITER_SYSTEM,
        prompt: buildWritePrompt(research, feedback),
        json: true,
        temperature: 0.85,
        maxOutputTokens: 6000,
        timeoutMs: attempt === 1 ? 35000 : Math.min(30000, 57000 - elapsed),
      });

      const candidate = normalizeDraft(extractJson(result.text));
      const gate = checkDraft(candidate, researchText);
      if (gate.passed) {
        draft = candidate;
        lastIssues = [];
        break;
      }
      lastIssues = gate.issues;
      previousBody = candidate.body;
      feedback = gate.issues.map((issue) => {
        if (/too short/i.test(issue)) {
          return `${issue}. Rewrite it at 900 to 1,200 words using ONLY the research: explain how the condition or issue works, what the signs are, what farmers should do step by step, what is not yet known, and why it matters now. Do not add facts that are not in the research.\n\nYour previous draft, to expand (add detail from the research, do not just repeat it):\n${previousBody}`;
        }
        if (/too generic/i.test(issue)) {
          const figures = researchFigures(researchText).slice(0, 12);
          return `${issue}. Work at least two of these figures or dates into the article exactly as the research gives them: ${figures.join(', ')}. Say what each one refers to.`;
        }
        return issue;
      });
    }

    if (!draft) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `The draft did not pass the quality checks: ${lastIssues.join('; ') || 'ran out of time'}`,
      });
    }

    return NextResponse.json({ ok: true, draft, words: wordCount(draft.body) });
  } catch (error) {
    console.error('autopublish/write failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Writing stage failed' },
      { status: 500 }
    );
  }
}
