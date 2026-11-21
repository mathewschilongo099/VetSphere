// Fixes the two SEO problems that can be repaired safely by code: titles and
// meta descriptions that are the wrong length. Everything else in the article
// is left exactly as it is. Pure functions, no network.

import { buildArticle, parseArticle, type ArticleMeta } from '@/lib/frontmatter';

export const TITLE_MIN = 20;
export const TITLE_MAX = 65;
export const DESC_MIN = 70;
export const DESC_MAX = 160;

const TITLE_SUFFIX = ': Signs, Causes and Prevention';

// Short disease titles ("Bloat in Cattle") get a plain, accurate ending; long
// ones are cut at a natural break.
export function fixTitle(title: string): string {
  let t = title.replace(/\s+/g, ' ').trim();
  if (!t) return t;
  if (t.length < TITLE_MIN) {
    if (!t.includes(':')) t += TITLE_SUFFIX;
    if (t.length < TITLE_MIN) t += ' Guide';
  }
  if (t.length > TITLE_MAX) {
    const head = t.split(/\s*(?::|\||–|—)\s+|\s+-\s+/)[0].trim();
    if (head.length >= TITLE_MIN && head.length <= TITLE_MAX) return head;
    const cut = t.slice(0, TITLE_MAX);
    const space = cut.lastIndexOf(' ');
    return cut.slice(0, space >= TITLE_MIN ? space : TITLE_MAX).replace(/[\s,;:|–—-]+$/, '');
  }
  return t;
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wholeSentences(text: string, max: number): string {
  let out = '';
  for (const sentence of splitSentences(text)) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

// Plain sentences from the first few real paragraphs of the article.
function bodySentences(body: string): string[] {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p && !/^(#|\||!\[|>|[-*]\s|\d+[.)]\s|<)/.test(p))
    .slice(0, 4);
  const out: string[] = [];
  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(plainText(paragraph))) {
      if (sentence.length >= 30 && sentence.length <= DESC_MAX - 5) out.push(sentence);
    }
  }
  return out;
}

export function fixDescription(description: string, body: string, title: string): string {
  const desc = description.replace(/\s+/g, ' ').trim();
  if (desc.length >= DESC_MIN && desc.length <= DESC_MAX) return desc;

  if (desc.length > DESC_MAX) {
    const whole = wholeSentences(desc, DESC_MAX);
    if (whole.length >= DESC_MIN) return whole;
    const cut = desc.slice(0, DESC_MAX - 1);
    const space = cut.lastIndexOf(' ');
    return cut.slice(0, space > DESC_MIN ? space : cut.length).replace(/[\s,;:–—-]+$/, '') + '…';
  }

  // Too short (or empty): add the opening sentences of the article.
  let out = desc && !/[.!?…]$/.test(desc) ? `${desc}.` : desc;
  for (const sentence of bodySentences(body)) {
    if (out.toLowerCase().includes(sentence.toLowerCase())) continue;
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > DESC_MAX) continue;
    out = next;
    if (out.length >= 90) break;
  }
  if (out.length >= DESC_MIN) return out;

  const base = (title.split(':')[0] || title).trim();
  const fallback = `${base}: signs, causes, prevention and when to ask a veterinarian for help.`;
  return fallback.length <= DESC_MAX ? fallback : fallback.slice(0, DESC_MAX - 1).trim() + '…';
}

export interface SeoFix {
  name: string;
  text: string; // the full new file
  title?: { from: string; to: string };
  description?: { from: string; to: string };
}

// Works out the repairs for every published or scheduled article. Drafts are
// still being written, so they are not touched.
export function planSeoFixes(files: Array<{ name: string; text: string }>): SeoFix[] {
  const fixes: SeoFix[] = [];
  for (const file of files) {
    const { meta, body } = parseArticle(file.text);
    if (meta.draft) continue;

    const patch: Partial<ArticleMeta> = {};
    const fix: SeoFix = { name: file.name, text: file.text };

    const newTitle = fixTitle(meta.title);
    if (newTitle && newTitle !== meta.title.trim()) {
      patch.title = newTitle;
      fix.title = { from: meta.title, to: newTitle };
    }

    const newDescription = fixDescription(meta.description, body, newTitle || meta.title);
    if (newDescription && newDescription !== meta.description.trim()) {
      patch.description = newDescription;
      fix.description = { from: meta.description, to: newDescription };
    }

    if (!fix.title && !fix.description) continue;
    fix.text = buildArticle(file.text, patch);
    fixes.push(fix);
  }
  return fixes;
}
