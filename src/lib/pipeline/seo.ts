// Real search demand, for free: Google's own autocomplete shows what people
// actually type. The writer uses these phrases for headings, FAQ questions and
// keywords, so the article matches what people search for.

const GENERIC = new Set(['the', 'a', 'an', 'in', 'of', 'and', 'to', 'for', 'on', 'is', 'are', 'what', 'how']);

export function parseSuggestions(payload: unknown): string[] {
  // Google answers with ["query", ["suggestion", ...], ...]
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) return [];
  return payload[1].map((s) => String(s).trim()).filter(Boolean);
}

export function keywordTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !GENERIC.has(w))
    .map((w) => w.replace(/(ies)$/, 'y').replace(/s$/, ''));
}

function relevantTo(seed: string, phrase: string): boolean {
  const wanted = keywordTokens(seed);
  const have = new Set(keywordTokens(phrase));
  if (wanted.length === 0) return true;
  const shared = wanted.filter((t) => have.has(t)).length;
  return shared / wanted.length >= 0.5;
}

async function suggest(query: string, country: string): Promise<string[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=${country}&q=${encodeURIComponent(query)}`,
      { signal: controller.signal, cache: 'no-store' }
    );
    if (!res.ok) return [];
    return parseSuggestions(await res.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Up to `limit` real searches related to the keyword. Empty if Google cannot be reached. */
export async function fetchSearchPhrases(keyword: string, limit = 14): Promise<string[]> {
  const seed = keyword.trim();
  if (!seed) return [];
  const variants = [
    seed,
    `${seed} symptoms`,
    `${seed} treatment`,
    `${seed} prevention`,
    `how to ${seed}`,
    `${seed} in`,
    `${seed} causes`,
  ];
  const countries = ['us', 'za', 'gb'];
  const lists = await Promise.all(
    variants.map((v, i) => suggest(v, countries[i % countries.length]))
  );

  const seen = new Set<string>();
  const out: string[] = [];
  for (const phrase of lists.flat()) {
    const key = phrase.toLowerCase();
    if (seen.has(key) || key === seed.toLowerCase()) continue;
    if (!relevantTo(seed, phrase)) continue;
    seen.add(key);
    out.push(phrase);
  }
  return out.slice(0, limit);
}
