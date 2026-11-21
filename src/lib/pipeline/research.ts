// Shared research step: searches the live web for a topic and builds a fact
// sheet with the real sources that were used. Used by the automatic pipeline and
// by the manual article writer, so both write from sources and never from memory.

import { callGemini, extractJson, GeminiError, type GeminiResult } from './gemini';
import { researchFromNews } from './news-research';
import { RESEARCH_SYSTEM, buildResearchPrompt, type Research, type TopicChoice } from './prompts';

interface RawResearch {
  summary?: string;
  facts?: Array<{ fact?: string; detail?: string; source?: string }>;
  farmer_actions?: string[];
  unknowns?: string[];
}

export type ResearchOutcome = { ok: true; research: Research } | { ok: false; reason: string };

export async function researchTopic(topic: TopicChoice, timeoutMs = 50000): Promise<ResearchOutcome> {
  let result: GeminiResult;
  try {
    result = await callGemini({
      system: RESEARCH_SYSTEM,
      prompt: buildResearchPrompt(topic),
      search: true,
      temperature: 0.2,
      maxOutputTokens: 4000,
      timeoutMs,
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
    return {
      ok: false,
      reason: `Only ${facts.length} verifiable facts were found for "${topic.topic}", which is not enough to write a reliable article.`,
    };
  }
  if (distinctSources.size < 2) {
    return { ok: false, reason: `Fewer than two independent sources were found for "${topic.topic}".` };
  }

  return {
    ok: true,
    research: {
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
    },
  };
}
