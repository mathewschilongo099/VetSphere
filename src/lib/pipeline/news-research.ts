// Free research fallback for the autopublish research stage.
//
// The normal research stage uses Gemini with Google Search. When Gemini is out
// of quota or down, this finds real, current web and news pages about the topic
// (You.com Search with YOU_API_KEY, which has free credits; then GNews with
// GNEWS_API_KEY, free plan), and has a free model (Groq or Cerebras, via
// callGemini's fallback) build the fact sheet from those results ONLY. The
// sources it returns are the real page links, so the later stages (writer,
// fact-checker, source list) work exactly as before.
//
// It returns null when it cannot find enough real sources. Nothing is ever
// made up to fill the gap.

import { callGemini, type GeminiResult, type Source } from './gemini';
import { RESEARCH_SYSTEM, buildResearchPrompt, type TopicChoice } from './prompts';

interface Evidence {
  title: string;
  outlet: string;
  date: string;
  url: string;
  snippet: string;
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function clean(text: unknown, max: number): string {
  return typeof text === 'string' ? text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string, init: RequestInit, label: string): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      console.warn(`${label} failed (HTTP ${res.status}).`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.warn(`${label} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// You.com Search: ranked web and news results with text excerpts.
async function searchYou(apiKey: string, query: string): Promise<Evidence[]> {
  const json = await fetchJson(
    'https://ydc-index.io/v1/search',
    {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, count: 8 }),
    },
    'You.com search'
  );
  if (!json) return [];
  const groups: unknown[] = [json?.results?.news, json?.results?.web, json?.hits];
  const out: Evidence[] = [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const r of group as any[]) {
      const url = typeof r?.url === 'string' ? r.url.trim() : '';
      const title = clean(r?.title, 200);
      if (!title || !/^https?:\/\//.test(url)) continue;
      const snippets = Array.isArray(r?.snippets) ? r.snippets.join(' ') : '';
      out.push({
        title,
        outlet: hostName(url),
        date: clean(r?.page_age ?? r?.date ?? '', 10),
        url,
        snippet: clean(`${r?.description ?? ''} ${snippets}`, 800),
      });
    }
  }
  console.warn(`You.com search returned ${out.length} results.`);
  return out;
}

// GNews: recent news articles (free plan: short descriptions, about 100 calls a day).
async function searchGNews(apiKey: string, query: string): Promise<Evidence[]> {
  const url =
    `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10` +
    `&apikey=${encodeURIComponent(apiKey)}`;
  const json = await fetchJson(url, {}, 'GNews search');
  const articles: any[] = Array.isArray(json?.articles) ? json.articles : [];
  const out: Evidence[] = [];
  for (const a of articles) {
    const articleUrl = typeof a?.url === 'string' ? a.url.trim() : '';
    const title = clean(a?.title, 200);
    if (!title || !/^https?:\/\//.test(articleUrl)) continue;
    out.push({
      title,
      outlet: clean(a?.source?.name, 80) || hostName(articleUrl),
      date: clean(a?.publishedAt, 10),
      url: articleUrl,
      snippet: clean(`${a?.description ?? ''} ${String(a?.content ?? '').replace(/\[\d+ chars\]\s*$/, '')}`, 700),
    });
  }
  console.warn(`GNews search returned ${out.length} articles.`);
  return out;
}

export async function researchFromNews(topic: TopicChoice): Promise<GeminiResult | null> {
  const youKey = (process.env.YOU_API_KEY ?? process.env.YDC_API_KEY ?? '').trim();
  const gnewsKey = process.env.GNEWS_API_KEY?.trim() ?? '';
  if (!youKey && !gnewsKey) return null;

  let found: Evidence[] = [];
  if (youKey) found = await searchYou(youKey, `${topic.topic} livestock`);

  if (found.length < 4 && gnewsKey) {
    // GNews's free plan allows about one request per second, so space them out.
    found = [...found, ...(await searchGNews(gnewsKey, topic.topic))];
    if (found.length < 4) {
      const shorter = topic.topic.split(/\s+/).slice(0, 3).join(' ');
      if (shorter && shorter !== topic.topic) {
        await sleep(1200);
        found = [...found, ...(await searchGNews(gnewsKey, shorter))];
      }
    }
  }

  const seenUrls = new Set<string>();
  const usable: Evidence[] = [];
  for (const e of found) {
    if (seenUrls.has(e.url) || e.snippet.length < 40) continue;
    seenUrls.add(e.url);
    usable.push(e);
    if (usable.length >= 8) break;
  }

  const outlets = new Set(usable.map((u) => u.outlet.toLowerCase()));
  if (usable.length < 3 || outlets.size < 2) {
    console.warn(
      `Research fallback found only ${usable.length} usable pages from ${outlets.size} outlets (${found.length} results before filtering).`
    );
    return null;
  }

  const evidence = usable
    .map((u, i) => `[${i + 1}] ${u.title}\nOutlet: ${u.outlet} | Date: ${u.date || 'recent'}\nURL: ${u.url}\n${u.snippet}`)
    .join('\n\n');

  const prompt =
    `SEARCH RESULTS (live web search is not available right now, so these pages are your only search results; use nothing else)\n\n` +
    `${evidence}\n\n---\n\n${buildResearchPrompt(topic)}\n\n` +
    `In each fact's "source" field write the outlet name exactly as shown above. ` +
    `Only use results that are about this topic and about animals; ignore the rest. ` +
    `If the results give fewer than 6 facts, return only the facts they support.`;

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
    console.warn(`Research built from ${usable.length} real pages (Gemini search unavailable).`);
    return { text: result.text, sources, queries: [topic.topic] };
  } catch (error) {
    console.warn(`Research fallback failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    return null;
  }
}
