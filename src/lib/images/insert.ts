// Puts the chosen pictures into the article text, right under each ## heading.

import type { PickedImage } from './pick';

function cleanHeading(text: string): string {
  return text.replace(/[*_`]/g, '').trim();
}

/** The ## headings of an article body (cleaned of markdown marks), first `max` of them. */
export function sectionHeadings(body: string, max = 5): string[] {
  return Array.from(body.matchAll(/^##\s+(.+?)\s*$/gm))
    .map((m) => cleanHeading(m[1]))
    .slice(0, max);
}

export function insertUnderHeadings(body: string, picks: Map<string, PickedImage>): string {
  const remaining = new Map(picks);
  return body
    .split('\n')
    .flatMap((line) => {
      const m = line.match(/^##\s+(.+?)\s*$/);
      if (!m) return [line];
      const key = cleanHeading(m[1]);
      const pick = remaining.get(key);
      if (!pick) return [line];
      remaining.delete(key);
      const alt = (pick.alt || key).replace(/[\[\]\n]/g, ' ').trim();
      return [line, '', `![${alt}](${pick.url})`, ''];
    })
    .join('\n');
}
