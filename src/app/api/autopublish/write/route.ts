// Stage 3 of 4: write the article from the fact sheet, then run the strict
// quality checks. One automatic rewrite is allowed if the first draft fails.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import { checkDraft, normalizeDraft, wordCount, type Draft } from '@/lib/pipeline/gate';
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

    for (let attempt = 1; attempt <= 2; attempt++) {
      // Do not start a second attempt if the first one used most of the time budget.
      const elapsed = Date.now() - startedAt;
      if (attempt === 2 && elapsed > 34000) break;

      const result = await callGemini({
        system: WRITER_SYSTEM,
        prompt: buildWritePrompt(research, feedback),
        json: true,
        temperature: 0.85,
        maxOutputTokens: 6000,
        timeoutMs: attempt === 1 ? 35000 : Math.min(25000, 57000 - elapsed),
      });

      const candidate = normalizeDraft(extractJson(result.text));
      const gate = checkDraft(candidate, researchText);
      if (gate.passed) {
        draft = candidate;
        lastIssues = [];
        break;
      }
      lastIssues = gate.issues;
      feedback = gate.issues.map((issue) =>
        /too short/i.test(issue)
          ? `${issue}. Rewrite it at 900 to 1,200 words using ONLY the research: explain how the condition or issue works, what the signs are, what farmers should do step by step, what is not yet known, and why it matters now. Do not add facts that are not in the research.`
          : issue
      );
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
