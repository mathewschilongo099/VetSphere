// Stage 2 of 4: research the chosen topic on the live web and build a fact sheet
// with the real sources that were used.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { callGemini, extractJson, GeminiError, type GeminiResult } from '@/lib/pipeline/gemini';
import { researchFromNews } from '@/lib/pipeline/news-research';
import { RESEARCH_SYSTEM, buildResearchPrompt, type Research, type TopicChoice } from '@/lib/pipeline/prompts';

interface RawResearch {
  summary?: string;
  facts?: Array<{ fact?: string; detail?: string; source?: string }>;
  farmer_actions?: string[];
  unknowns?: string[];
}

function isTopicChoice(value: unknown): value is TopicChoice {
  const v = value as TopicChoice;
  return !!v && typeof v.topic === 'string' && v.topic.length > 0 && Array.isArray(v.headlines);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isTopicChoice(body?.topic)) {
      return NextResponse.json({ ok: false, error: 'A topic from the topic stage is required' }, { status: 400 });
    }
    const topic: TopicChoice = body.topic;

    let result: GeminiResult;
    try {
      result = await callGemini({
        system: RESEARCH_SYSTEM,
        prompt: buildResearchPrompt(topic),
        search: true,
        temperature: 0.2,
        maxOutputTokens: 4000,
        timeoutMs: 50000,
      });
    } catch (error) {
      // Gemini search is down or out of quota. Build the fact sheet from real,
      // current news articles with a free model instead. If that cannot find
      // enough real sources, fail with the original Gemini error.
      if (!(error instanceof GeminiError)) throw error;
      const fallback = await researchFromNews(topic);
      if (!fallback) throw error;
      result = fallback;
    }

    const raw = extractJson<RawResearch>(result.text);
    const facts = (raw.facts ?? [])
      .map((f) => ({
        fact: String(f.fact ?? '').trim(),
        detail: f.detail ? String(f.detail).trim() : undefined,
        source: f.source ? String(f.source).trim() : undefined,
      }))
      .filter((f) => f.fact.length > 0)
      .slice(0, 14);

    const distinctSources = new Set(result.sources.map((s) => s.title.toLowerCase()));

    if (facts.length < 4) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Only ${facts.length} verifiable facts were found for "${topic.topic}", which is not enough to write a reliable article.`,
      });
    }
    if (distinctSources.size < 2) {
      return NextResponse.json({
        ok: false,
        skipped: true,
        reason: `Fewer than two independent sources were found for "${topic.topic}".`,
      });
    }

    const research: Research = {
      topic: topic.topic,
      angle: topic.angle,
      whyNow: topic.whyNow,
      headlines: topic.headlines,
      summary: String(raw.summary ?? '').trim(),
      facts,
      farmerActions: (raw.farmer_actions ?? []).map(String).slice(0, 8),
      unknowns: (raw.unknowns ?? []).map(String).slice(0, 6),
      sources: result.sources.slice(0, 8),
      researchedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, research });
  } catch (error) {
    console.error('autopublish/research failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Research stage failed' },
      { status: 500 }
    );
  }
}
