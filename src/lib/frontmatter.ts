// Dependency-free helpers for reading and editing the YAML front matter of
// article files. They run in the browser and on the server. Editing only
// touches the fields you pass in, so unknown fields and formatting survive.

export interface ArticleMeta {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  featured: boolean;
  draft: boolean;
  publishDate: string;
}

export type ArticleStatus = 'published' | 'draft' | 'scheduled';

export const EMPTY_META: ArticleMeta = {
  title: '',
  description: '',
  date: '',
  author: '',
  category: '',
  tags: [],
  image: '',
  imageAlt: '',
  featured: false,
  draft: false,
  publishDate: '',
};

const ORDER: (keyof ArticleMeta)[] = [
  'title',
  'description',
  'date',
  'author',
  'category',
  'tags',
  'image',
  'imageAlt',
  'featured',
  'draft',
  'publishDate',
];

// A new top-level YAML key at the start of a line.
const ANY_KEY = /^[A-Za-z_][\w-]*\s*:/;

function findKey(lines: string[], key: string): number {
  const re = new RegExp(`^${key}\\s*:`);
  return lines.findIndex((line) => re.test(line));
}

export function splitFrontmatter(raw: string): { fm: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fm: '', body: raw };
  return { fm: match[1], body: raw.slice(match[0].length) };
}

// Returns the raw value of a field, including continuation lines (for example
// a tags list written as "- item" lines).
function readField(fm: string, key: string): string {
  const lines = fm.split(/\r?\n/);
  const i = findKey(lines, key);
  if (i === -1) return '';
  const parts: string[] = [lines[i].replace(new RegExp(`^${key}\\s*:\\s*`), '')];
  for (let j = i + 1; j < lines.length && !ANY_KEY.test(lines[j]); j++) parts.push(lines[j]);
  return parts.join('\n').trim();
}

function unquote(value: string): string {
  const t = value.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      return JSON.parse(t) as string;
    } catch {
      return t.slice(1, -1).replace(/\\"/g, '"');
    }
  }
  if (t.length >= 2 && t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

function parseTags(value: string): string[] {
  const t = value.trim();
  if (!t) return [];
  if (t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      // fall through to the simple parser below
    }
    return t
      .replace(/^\[|\]$/g, '')
      .split(',')
      .map((s) => unquote(s))
      .filter(Boolean);
  }
  return t
    .split(/\r?\n/)
    .map((line) => unquote(line.replace(/^\s*-\s*/, '')))
    .filter(Boolean);
}

// Replaces (or inserts, or with null removes) one top-level field. Block
// values such as multi-line tag lists are replaced as a whole.
export function setField(fm: string, key: string, literal: string | null): string {
  const lines = fm ? fm.split(/\r?\n/) : [];
  const i = findKey(lines, key);
  if (i === -1) {
    if (literal === null) return fm;
    return fm ? `${fm}\n${key}: ${literal}` : `${key}: ${literal}`;
  }
  let end = i + 1;
  while (end < lines.length && !ANY_KEY.test(lines[end])) end++;
  lines.splice(i, end - i, ...(literal === null ? [] : [`${key}: ${literal}`]));
  return lines.join('\n');
}

export function parseArticle(raw: string): { meta: ArticleMeta; body: string } {
  const { fm, body } = splitFrontmatter(raw);
  const get = (key: string) => unquote(readField(fm, key));
  return {
    meta: {
      title: get('title'),
      description: get('description'),
      date: get('date'),
      author: get('author'),
      category: get('category'),
      tags: parseTags(readField(fm, 'tags')),
      image: get('image'),
      imageAlt: get('imageAlt'),
      featured: /^true$/i.test(get('featured')),
      draft: /^true$/i.test(get('draft')),
      publishDate: get('publishDate'),
    },
    body: body.replace(/^\s*\n/, ''),
  };
}

// Applies the given fields to an existing file (or builds a new one from an
// empty string) and optionally replaces the body.
export function buildArticle(raw: string, patch: Partial<ArticleMeta>, body?: string): string {
  const { fm, body: oldBody } = splitFrontmatter(raw);
  let out = fm;
  for (const key of ORDER) {
    if (!(key in patch)) continue;
    const value = patch[key];
    let literal: string | null;
    if (key === 'tags') literal = JSON.stringify(Array.isArray(value) ? value : []);
    else if (key === 'featured') literal = value ? 'true' : 'false';
    else if (key === 'draft') literal = value ? 'true' : null;
    else if (key === 'publishDate') literal = value ? JSON.stringify(String(value)) : null;
    else literal = JSON.stringify(String(value ?? ''));
    out = setField(out, key, literal);
  }
  const nextBody = body !== undefined ? body : oldBody;
  return `---\n${out}\n---\n\n${nextBody.replace(/^\s*\n/, '')}`;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100)
    .replace(/-$/, '');
}

export function wordCount(body: string): number {
  const t = body.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function articleStatus(
  meta: { draft: boolean; publishDate: string },
  now: number = Date.now()
): ArticleStatus {
  if (meta.draft) return 'draft';
  if (meta.publishDate) {
    const t = Date.parse(meta.publishDate);
    if (Number.isFinite(t) && t > now) return 'scheduled';
  }
  return 'published';
}

// The site only allows its own uploads plus Unsplash and Pexels images
// (see next.config.mjs), so anything else would not display on the public site.
export function isAllowedImage(url: string): boolean {
  const u = url.trim();
  if (!u) return true;
  if (u.startsWith('/') && !u.startsWith('//')) return true;
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'https:' && /^([a-z0-9-]+\.)+(unsplash|pexels)\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}
