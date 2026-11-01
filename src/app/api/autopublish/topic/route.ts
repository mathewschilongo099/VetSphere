// Stage 1 of 4: choose today's topic from what is trending in livestock news.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { callGemini, extractJson } from '@/lib/pipeline/gemini';
import { findDuplicate } from '@/lib/pipeline/gate';
import { listExistingArticles } from '@/lib/pipeline/github';
import { TOPIC_SYSTEM, buildTopicPrompt, type TopicChoice } from '@/lib/pipeline/prompts';
import { fetchHeadlines } from '@/lib/pipeline/topics';

interface Candidate {
  topic?: string;
  angle?: string;
  why_now?: string;
  headline_ids?: number[];
}

export async function POST() {
  try {
    const [existing, headlines] = await Promise.all([listExistingArticles(), fetchHeadlines()]);

    if (headlines.length < 5) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Only ${headlines.length} fresh livestock headlines were found, so no topic was chosen.`,
      });
    }

    // Headlines take up to ~7 s, so two 22 s attempts still fit in the 60 s limit.
    const result = await callGemini({
      system: TOPIC_SYSTEM,
      prompt: buildTopicPrompt(
        headlines,
        existing.map((a) => a.title)
      ),
      json: true,
      temperature: 0.3,
      maxOutputTokens: 1500,
      timeoutMs: 22000,
      retryOnTimeout: true,
    });

    const parsed = extractJson<{ candidates?: Candidate[] }>(result.text);
    const candidates = parsed.candidates ?? [];

    for (const candidate of candidates) {
      const topic = (candidate.topic ?? '').trim();
      if (!topic) continue;

      const matched = headlines.filter((h) => (candidate.headline_ids ?? []).includes(h.id));
      const outlets = new Set(matched.map((h) => h.source.toLowerCase()));
      if (outlets.size < 2) continue; // not trending: only one outlet

      if (findDuplicate(topic, existing, 0.5)) continue; // already on the site

      const choice: TopicChoice = {
        topic,
        angle: (candidate.angle ?? '').trim(),
        whyNow: (candidate.why_now ?? '').trim(),
        headlines: matched.slice(0, 8).map((h) => ({ title: h.title, source: h.source, date: h.date })),
      };
      return NextResponse.json({ ok: true, topic: choice });
    }

    return NextResponse.json({
      ok: false,
      skipped: true,
      reason: 'No trending livestock topic was found that two or more outlets cover and the site has not already published.',
    });
  } catch (error) {
    console.error('autopublish/topic failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Topic stage failed' },
      { status: 500 }
    );
  }
}
