// Free research fallback for the autopublish research stage.
//
// The normal research stage uses Gemini with Google Search. When Gemini is out
// of quota or down, this finds real, current news articles about the topic
// through GNews (GNEWS_API_KEY, free plan), then has a free model (Groq or
// Cerebras, via callGemini's fallback) build the fact sheet from those
// articles ONLY. The sources it returns are the real article links, so the
// later stages (writer, fact-checker, source list) work exactly as before.
//
// It returns null when it cannot find enough real sources. Nothing is ever
// made up to fill the gap.

import { callGemini, type GeminiResult, type Source } from './gemini';
import { RESEARCH_SYSTEM, buildResearchPrompt, type TopicChoice } from './prompts';

interface GNewsArticle {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
}

async function searchGNews(apiKey: string, query: string): Promise<GNewsArticle[]> {
  const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const url =
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10` +
    `&from=${encodeURIComponent(from)}&apikey=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      console.warn(`GNews search failed (HTTP ${res.status}).`);
      return [];
    }
    const json: any = await res.json();
    return Array.isArray(json?.articles) ? json.articles : [];
  } catch (error) {
    console.warn(`GNews search failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function researchFromNews(topic: TopicChoice): Promise<GeminiResult | null> {
  const apiKey = process.env.GNEWS_API_KEY?.trim();
  if (!apiKey) return null;

  let articles = await searchGNews(apiKey, topic.topic);
  if (articles.length < 3) {
    // A long topic name can match nothing; try its first few words.
    const shorter = topic.topic.split(/\s+/).slice(0, 3).join(' ');
    if (shorter && shorter !== topic.topic) {
      articles = [...articles, ...(await searchGNews(apiKey, shorter))];
    }
  }

  const seenUrls = new Set<string>();
  const usable: Array<{ title: string; outlet: string; date: string; url: string; snippet: string }> = [];
  for (const a of articles) {
    const title = (a.title ?? '').trim();
    const url = (a.url ?? '').trim();
    if (!title || !/^https?:\/\//.test(url) || seenUrls.has(url)) continue;
    const snippet = [a.description, a.content?.replace(/\[\d+ chars\]\s*$/, '')]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 700);
    if (snippet.length < 40) continue;
    seenUrls.add(url);
    usable.push({
      title,
      outlet: (a.source?.name ?? '').trim() || 'Unknown outlet',
      date: (a.publishedAt ?? '').slice(0, 10),
      url,
      snippet,
    });
    if (usable.length >= 8) break;
  }

  const outlets = new Set(usable.map((u) => u.outlet.toLowerCase()));
  if (usable.length < 3 || outlets.size < 2) {
    console.warn(`News research fallback found only ${usable.length} usable articles from ${outlets.size} outlets.`);
    return null;
  }

  const evidence = usable
    .map((u, i) => `[${i + 1}] ${u.title}\nOutlet: ${u.outlet} | Date: ${u.date || 'recent'}\nURL: ${u.url}\n${u.snippet}`)
    .join('\n\n');

  const prompt =
    `SEARCH RESULTS (live web search is not available right now, so these news articles are your only search results; use nothing else)\n\n` +
    `${evidence}\n\n---\n\n${buildResearchPrompt(topic)}\n\n` +
    `In each fact's "source" field write the outlet name exactly as shown above. ` +
    `If the articles give fewer than 6 facts, return only the facts they support.`;

  try {
    const result = await callGemini({
      system: RESEARCH_SYSTEM,
      prompt,
      json: true,
      temperature: 0.2,
      maxOutputTokens: 3000,
      timeoutMs: 25000,
    });
    const sources: Source[] = usable.map((u) => ({ title: `${u.title} - ${u.outlet}`, url: u.url }));
    console.warn(`Research built from ${usable.length} GNews articles (Gemini search unavailable).`);
    return { text: result.text, sources, queries: [topic.topic] };
  } catch (error) {
    console.warn(`News research fallback failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return null;
  }
}
