// Quality gate for auto-published articles. Everything here is pure (no
// network), so it is easy to test. The gate is deliberately strict: a draft
// that fails is skipped and logged, never published.

export const CATEGORY_OPTIONS = [
  'Animal Health',
  'Livestock Production',
  'Poultry Farming',
  'Dairy Farming',
] as const;

export interface Draft {
  title: string;
  description: string;
  category: string;
  tags: string[];
  body: string;
}

export interface GateResult {
  passed: boolean;
  issues: string[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
    .replace(/-$/, '');
}

export function wordCount(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ');
  return (plain.match(/\b[\p{L}\p{N}'’]+\b/gu) ?? []).length;
}

// ---------- duplicate detection ----------

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'how', 'why', 'are', 'you',
  'your', 'into', 'about', 'new', 'now', 'its', 'has', 'have', 'will', 'can', 'all', 'more',
  'farmers', 'farm', 'livestock', 'guide', 'news',
]);

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  );
}

export function titleSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => {
    if (tb.has(t)) shared++;
  });
  return shared / (ta.size + tb.size - shared);
}

/** Returns the slug of a too-similar existing article, or null. */
export function findDuplicate(
  title: string,
  existing: Array<{ slug: string; title: string }>,
  threshold = 0.6
): string | null {
  const slug = slugify(title);
  for (const article of existing) {
    if (article.slug === slug) return article.slug;
    if (titleSimilarity(title, article.title) >= threshold) return article.slug;
  }
  return null;
}

// ---------- AI-sounding phrases ----------

export const BANNED_PHRASES = [
  'in conclusion',
  'it is important to note',
  "it's important to note",
  'it is worth noting',
  "it's worth noting",
  'delve',
  'tapestry',
  'landscape of',
  "in today's",
  'ever-evolving',
  'crucial role',
  'vital role',
  'comprehensive guide',
  'navigate the',
  'game-changer',
  'game changer',
  'unlock the',
  'as an ai',
  'i hope this',
  'stay tuned',
  'in the realm of',
  'look no further',
  'dive into',
  'deep dive',
  'at the end of the day',
  'needless to say',
  'rest assured',
  'in a nutshell',
  'final thoughts',
];

export function findBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((phrase) => lower.includes(phrase));
}

// ---------- numbers must come from the research ----------

function normalizeNumber(raw: string): string {
  return raw.replace(/,/g, '').replace(/\.$/, '');
}

export function extractNumbers(text: string): string[] {
  const cleaned = text
    .replace(/^\s*\d+[.)]\s+/gm, '') // ordered-list markers
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, ' ');
  const matches = cleaned.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches.map(normalizeNumber).filter(Boolean);
}

/** Numbers in the article that do not appear anywhere in the research. */
export function unsupportedNumbers(article: string, researchText: string): string[] {
  const allowed = new Set(extractNumbers(researchText));
  const year = new Date().getUTCFullYear();
  const unsupported = new Set<string>();
  for (const n of extractNumbers(article)) {
    if (allowed.has(n)) continue;
    const value = Number(n);
    if (Number.isInteger(value) && value >= 0 && value <= 3) continue; // "3 steps", "2 weeks ago"
    if (value === year || value === year - 1) continue;
    unsupported.add(n);
  }
  return Array.from(unsupported);
}

// ---------- the gate ----------

function trimAtWord(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const sentenceEnd = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (sentenceEnd > max * 0.6) return cut.slice(0, sentenceEnd + 1);
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut).replace(/[,;:]$/, '') + '…';
}

export function normalizeDraft(raw: unknown): Draft {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = String(r.title ?? '').replace(/\s+/g, ' ').trim().replace(/^["“]|["”]$/g, '');
  const description = trimAtWord(String(r.description ?? ''), 160);
  const category = (CATEGORY_OPTIONS as readonly string[]).includes(String(r.category))
    ? String(r.category)
    : 'Animal Health';
  const tags = Array.isArray(r.tags)
    ? r.tags
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => t.length >= 3 && t.length <= 40)
        .slice(0, 6)
    : [];
  const body = String(r.body ?? '')
    .replace(/^\s*#\s+.+\n+/, '') // the page already shows the title
    .replace(/^\s*---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { title, description, category, tags, body };
}

export interface CheckOptions {
  /** The phrase people search for; the title and opening must contain it. */
  keyword?: string;
}

function stem(word: string): string {
  return word.replace(/ies$/, 'y').replace(/s$/, '');
}

function keywordCoverage(keyword: string, text: string): number {
  const wanted = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['the', 'and', 'for', 'how', 'what', 'new'].includes(w))
    .map(stem);
  if (wanted.length === 0) return 1;
  const have = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map(stem)
  );
  return wanted.filter((w) => have.has(w)).length / wanted.length;
}

const FAQ_HEADING_RE = /^##\s*frequently asked questions\b.*$/im;

/** Splits the body into the FAQ section and everything else. */
export function splitFaq(body: string): { main: string; faqQuestions: string[]; faqWords: number } {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => FAQ_HEADING_RE.test(l.trim()));
  if (start === -1) return { main: body, faqQuestions: [], faqWords: 0 };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+\S/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const section = lines.slice(start + 1, end);
  const faqQuestions = section.filter((l) => /^###\s+\S/.test(l)).map((l) => l.replace(/^###\s+/, '').trim());
  return {
    main: [...lines.slice(0, start), ...lines.slice(end)].join('\n'),
    faqQuestions,
    faqWords: wordCount(section.join('\n')),
  };
}

export function checkDraft(draft: Draft, researchText: string, options: CheckOptions = {}): GateResult {
  const issues: string[] = [];
  const { title, description, body } = draft;

  if (title.length < 20 || title.length > 70) issues.push(`Title length ${title.length} is outside 20–70 characters (Google cuts titles near 60)`);
  if (description.length < 110) issues.push(`Meta description is too short (${description.length} characters, aim for 140 to 158)`);
  if (draft.tags.length < 3) issues.push('Need at least 3 tags');

  if (options.keyword) {
    if (keywordCoverage(options.keyword, title) < 0.6) {
      issues.push(`The title must contain the search phrase "${options.keyword}"`);
    }
    const intro = body.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ');
    if (keywordCoverage(options.keyword, intro) < 0.5) {
      issues.push(`The first paragraph must use the search phrase "${options.keyword}"`);
    }
  }

  const faq = splitFaq(body);
  if (faq.faqQuestions.length < 3) {
    issues.push('Needs a "## Frequently Asked Questions" section with at least 3 questions written as "### Question?" headings');
  } else if (faq.faqQuestions.length > 6) {
    issues.push('Keep the FAQ to 6 questions at most');
  }
  if (faq.faqQuestions.some((q) => !q.endsWith('?'))) issues.push('Every FAQ question must end with a question mark');

  if (/<img\b|!\[[^\]]*\]\(/.test(body)) issues.push('Do not put pictures in the article; the site adds checked pictures itself');

  const words = wordCount(faq.main);
  if (words < 700) issues.push(`Article is too short (${words} words before the FAQ, minimum 700)`);
  if (words > 1800) issues.push(`Article is too long (${words} words before the FAQ, maximum 1800)`);

  const h2Count = (faq.main.match(/^##\s+\S/gm) ?? []).length;
  if (h2Count < 3) issues.push('Needs at least 3 section headings (##) besides the FAQ');
  if (/^#\s+\S/m.test(body)) issues.push('Body must not contain a top-level # heading');

  const banned = findBannedPhrases(`${title}\n${description}\n${body}`);
  if (banned.length > 0) issues.push(`Contains AI-sounding phrases: ${banned.join(', ')}`);

  const emDashes = (body.match(/—/g) ?? []).length;
  if (emDashes > 4) issues.push(`Too many em dashes (${emDashes})`);

  if (/\]\(https?:\/\//.test(body)) issues.push('Body must not contain links (sources are added automatically)');

  if (/\b(in my experience|i visited|i have visited|i've visited|i've seen|i have seen|we visited|our visit|my farm|our farm)\b/i.test(body)) {
    issues.push('Contains invented first-person experience');
  }

  const lines = body.split('\n').filter((l) => l.trim());
  const bullets = lines.filter((l) => /^\s*([-*•]|\d+[.)])\s/.test(l)).length;
  if (lines.length > 0 && bullets / lines.length > 0.35) issues.push('Too list-heavy; write mostly in paragraphs');

  const unsupported = unsupportedNumbers(`${title}\n${body}`, researchText);
  if (unsupported.length > 0) {
    issues.push(`Numbers not found in the research: ${unsupported.slice(0, 8).join(', ')}`);
  }

  const normalizedResearch = researchText.toLowerCase().replace(/\s+/g, ' ');
  const quotes = body.match(/[“"]([^”"\n]{25,})[”"]/g) ?? [];
  for (const q of quotes) {
    const inner = q.slice(1, -1).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalizedResearch.includes(inner)) {
      issues.push(`Quoted text not found in the research: ${q.slice(0, 60)}…`);
      break;
    }
  }

  return { passed: issues.length === 0, issues };
}

// ---------- topic relevance ----------

const LIVESTOCK_TERMS = [
  'cattle', 'cow', 'dairy', 'livestock', 'poultry', 'chicken', 'goat', 'sheep', 'pig', 'swine',
  'hog', 'herd', 'flock', 'beef', 'calf', 'calves', 'lamb', 'avian', 'bird flu', 'foot-and-mouth',
  'lumpy skin', 'brucellosis', 'anthrax', 'ruminant', 'veterinary', 'vaccine', 'farm',
];

const NOISE_TERMS = [
  'coupon', 'discount', 'prime day', 'crypto', 'celebrity', 'horoscope', 'recipe',
  'stock market', 'shares fall', 'shares rise', 'obituary',
];

export function isLivestockRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  if (NOISE_TERMS.some((t) => lower.includes(t))) return false;
  return LIVESTOCK_TERMS.some((t) => lower.includes(t));
}
