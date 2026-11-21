// Finds what is currently in the livestock news. "Trending" here means
// several independent outlets are covering the same story in the last 7 days.

import { isLivestockRelevant } from './gate';

export interface Headline {
  id: number;
  title: string;
  source: string;
  date: string; // YYYY-MM-DD
}

// Always searched: broad queries that catch whatever is breaking.
const CORE_QUERIES = [
  'livestock disease outbreak',
  'animal health livestock WOAH OR FAO OR ILRI',
];

// Narrower queries. A different few are used each day, so the same disease
// family does not dominate every run.
const ROTATING_QUERIES = [
  'cattle OR "dairy cows" disease OR outbreak',
  'poultry OR "avian influenza" OR "bird flu" OR "Newcastle disease"',
  '"foot-and-mouth disease" OR "lumpy skin disease" OR "African swine fever" OR "peste des petits ruminants"',
  'goats OR sheep disease OR vaccine',
  'pigs OR swine OR "pig farmers" disease OR outbreak',
  'livestock farmers veterinary drought OR feed OR vaccine',
  'drought OR heatwave OR flood livestock deaths OR feed shortage',
  'livestock vaccination campaign OR vaccine shortage',
  'livestock movement ban OR export ban OR import ban animal disease',
  'ticks OR parasites OR tsetse cattle OR goats',
  'dairy farmers milk disease OR feed OR heat stress',
];

const ROTATING_PER_RUN = 5;

function todaysQueries(): string[] {
  const day = Math.floor(Date.now() / 86400000);
  const rotating: string[] = [];
  for (let i = 0; i < ROTATING_PER_RUN; i++) {
    rotating.push(ROTATING_QUERIES[(day * ROTATING_PER_RUN + i) % ROTATING_QUERIES.length]);
  }
  return [...CORE_QUERIES, ...Array.from(new Set(rotating))];
}

const EDITIONS = [
  { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  { hl: 'en-ZA', gl: 'ZA', ceid: 'ZA:en' },
  { hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
];

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchFeed(query: string, edition: (typeof EDITIONS)[number]): Promise<string> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:7d`)}` +
    `&hl=${edition.hl}&gl=${edition.gl}&ceid=${edition.ceid}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHeadlines(): Promise<Headline[]> {
  const queries = todaysQueries();
  const feeds = await Promise.all(
    queries.flatMap((query, i) => [
      fetchFeed(query, EDITIONS[0]),
      fetchFeed(query, EDITIONS[1 + (i % (EDITIONS.length - 1))]),
    ])
  );

  const cutoff = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const seen = new Set<string>();
  const items: Omit<Headline, 'id'>[] = [];

  for (const xml of feeds) {
    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const item = match[1];
      const rawTitle = decodeEntities(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
      const source = decodeEntities(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? '');
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
      if (!rawTitle) continue;

      const timestamp = Date.parse(pubDate);
      if (Number.isFinite(timestamp) && timestamp < cutoff) continue;

      // Google News appends " - Publisher" to every title.
      const title = source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, -(source.length + 3))
        : rawTitle;
      if (!isLivestockRelevant(title)) continue;

      const key = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (seen.has(key)) continue;
      seen.add(key);

      items.push({
        title,
        source: source || 'Unknown',
        date: Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : '',
      });
    }
  }

  return items.slice(0, 80).map((item, index) => ({ id: index + 1, ...item }));
}
