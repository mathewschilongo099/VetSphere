// Places verified pictures into an article body and checks the pictures that
// are already in one. Pure functions.

import type { PickedImage } from './pick';

const FAQ_HEADING = /^##\s*(frequently asked questions|faqs?|common questions)\b/i;

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function imageTag(image: { url: string; alt: string }): string {
  return `<img src="${escapeAttr(image.url)}" alt="${escapeAttr(image.alt)}" loading="lazy" />`;
}

/**
 * Puts pictures under section headings, spread through the article. Never
 * under the first section, the FAQ, or the last section.
 */
export function insertInlineImages(body: string, images: PickedImage[]): string {
  if (images.length === 0) return body;
  const lines = body.split('\n');
  const headingLines: number[] = [];
  lines.forEach((line, i) => {
    if (/^##\s+\S/.test(line) && !FAQ_HEADING.test(line)) headingLines.push(i);
  });

  // Candidate sections: skip the first and the last.
  const middle = headingLines.slice(1, headingLines.length > 2 ? -1 : undefined);
  if (middle.length === 0) return body;

  const chosen: number[] = [];
  const step = middle.length / images.length;
  for (let i = 0; i < images.length; i++) {
    const idx = Math.min(middle.length - 1, Math.floor(i * step + step / 2));
    if (!chosen.includes(middle[idx])) chosen.push(middle[idx]);
  }

  const out: string[] = [];
  lines.forEach((line, i) => {
    out.push(line);
    const slot = chosen.indexOf(i);
    if (slot !== -1 && images[slot]) {
      out.push('', imageTag(images[slot]), '');
    }
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

export interface ImageIssue {
  url: string;
  problem: string;
}

/** Cheap structural checks on every picture in a body. */
export function checkBodyImages(body: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  const tags = body.match(/<img\b[^>]*>/gi) ?? [];
  const seen = new Set<string>();
  for (const tag of tags) {
    const url = (tag.match(/\bsrc="([^"]*)"/i) ?? [])[1] ?? '';
    const alt = (tag.match(/\balt="([^"]*)"/i) ?? [])[1] ?? '';
    if (!/^https:\/\//.test(url) && !url.startsWith('/')) issues.push({ url, problem: 'picture address is not https' });
    if (alt.trim().length < 8) issues.push({ url, problem: 'picture has no useful description (alt text)' });
    if (seen.has(url)) issues.push({ url, problem: 'the same picture is used twice' });
    seen.add(url);
  }
  if (tags.length > 4) issues.push({ url: '', problem: `too many pictures (${tags.length})` });
  return issues;
}

/** Every picture address in a body, in order. */
export function listBodyImages(body: string): Array<{ url: string; alt: string; tag: string }> {
  const tags = body.match(/<img\b[^>]*>/gi) ?? [];
  return tags.map((tag) => ({
    tag,
    url: (tag.match(/\bsrc="([^"]*)"/i) ?? [])[1] ?? '',
    alt: (tag.match(/\balt="([^"]*)"/i) ?? [])[1] ?? '',
  }));
}
