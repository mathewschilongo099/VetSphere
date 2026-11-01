// Stage 2 of 4: research the chosen topic on the live web and build a fact sheet
// with the real sources that were used. Gemini (Google Search) is tried first;
// if it fails, You.com research is used, and any available AI then turns that
// briefing into the same fact sheet.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { generate, extractJson } from '@/lib/ai/client';
import type { Source } from '@/lib/pipeline/gemini';
import {
  RESEARCH_SYSTEM,
  buildResearchPrompt,
  buildStructurePrompt,
  type Research,
  type TopicChoice,
} from '@/lib/pipeline/prompts';
import { fetchSearchPhrases } from '@/lib/pipeline/seo';

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

async function research(topic: TopicChoice, startedAt: number): Promise<{ raw: RawResearch; sources: Source[]; provider: string }> {
  // 1. Gemini with Google Search: returns JSON and the sources it used.
  try {
    const result = await generate({
      system: RESEARCH_SYSTEM,
      prompt: buildResearchPrompt(topic),
      search: true,
      providers: ['gemini'],
      temperature: 0.2,
      maxOutputTokens: 4000,
      timeoutMs: 28000,
      deadlineMs: startedAt + 56000,
      validate: (text) => {
        extractJson(text);
      },
    });
    return { raw: extractJson<RawResearch>(result.text), sources: result.sources, provider: result.provider };
  } catch (geminiError) {
    console.error('Gemini research failed, trying You.com:', geminiError);
  }

  // 2. You.com web research gives a written briefing and its sources.
  const briefing = await generate({
    prompt: `${buildResearchPrompt(topic)}\n\nWrite a detailed plain-text briefing. For every fact, say which source reported it.`,
    system: RESEARCH_SYSTEM,
    search: true,
    providers: ['you'],
    timeoutMs: 30000,
    deadlineMs: startedAt + 52000,
  });

  // 3. Any available AI turns the briefing into the fact sheet.
  const structured = await generate({
    system: RESEARCH_SYSTEM,
    prompt: buildStructurePrompt(topic, briefing.text),
    json: true,
    temperature: 0.1,
    maxOutputTokens: 3500,
    timeoutMs: 20000,
    deadlineMs: startedAt + 58000,
  });
  return {
    raw: extractJson<RawResearch>(structured.text),
    sources: briefing.sources,
    provider: `you.com + ${structured.provider}`,
  };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json().catch(() => null);
    if (!isTopicChoice(body?.topic)) {
      return NextResponse.json({ ok: false, error: 'A topic from the topic stage is required' }, { status: 400 });
    }
    const topic: TopicChoice = body.topic;

    // Real search demand, fetched while the research runs.
    const searchesPromise = fetchSearchPhrases(topic.keyword || topic.topic);
    const found = await research(topic, startedAt);
    const searches = await searchesPromise;

    const facts = (found.raw.facts ?? [])
      .map((f) => ({
        fact: String(f.fact ?? '').trim(),
        detail: f.detail ? String(f.detail).trim() : undefined,
        source: f.source ? String(f.source).trim() : undefined,
      }))
      .filter((f) => f.fact.length > 0)
      .slice(0, 14);

    const distinctSources = new Set(found.sources.map((s) => s.title.toLowerCase()));

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

    const result: Research = {
      topic: topic.topic,
      keyword: topic.keyword || topic.topic,
      searches,
      angle: topic.angle,
      whyNow: topic.whyNow,
      headlines: topic.headlines,
      summary: String(found.raw.summary ?? '').trim(),
      facts,
      farmerActions: (found.raw.farmer_actions ?? []).map(String).slice(0, 8),
      unknowns: (found.raw.unknowns ?? []).map(String).slice(0, 6),
      sources: found.sources.slice(0, 8),
      researchedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, research: result, provider: found.provider });
  } catch (error) {
    console.error('autopublish/research failed:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Research stage failed' },
      { status: 500 }
    );
  }
}
