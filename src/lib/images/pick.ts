// Chooses pictures for an article. Every picture is searched for by animal,
// pre-filtered by its description, then looked at by Gemini. Pictures that fail
// are replaced by the next candidate, from either photo source.

import { searchImages, type ImageCandidate } from './sources';
import { altLooksRight, altLooksWrong, type Subject } from './subjects';
import { verifyImage } from './verify';

export interface PickedImage {
  url: string;
  alt: string;
  source: string;
  /** vision = an AI looked at it. description = only the photo's own description was checked. */
  verified: 'vision' | 'description';
}

export interface PickOptions {
  subject: Subject;
  topic: string;
  /** Searches to try, best first. Defaults to the subject's own searches. */
  queries?: string[];
  /** Photo ids already used, so the same photo is never used twice. */
  exclude: Set<string>;
  deadlineMs: number;
  /** If the picture check is unavailable, accept a photo whose description names the right animal. */
  allowDescriptionOnly: boolean;
  /** Rotates which results are tried first so articles do not all share a photo. */
  seed?: number;
  log?: string[];
}

const BATCH = 3;
const MAX_ROUNDS = 2;
const MAX_QUERIES = 3;

export function rankCandidates(candidates: ImageCandidate[], subject: Subject, exclude: Set<string>, seed = 0): ImageCandidate[] {
  const seen = new Set<string>();
  const usable = candidates.filter((c) => {
    if (exclude.has(c.id) || seen.has(c.id)) return false;
    seen.add(c.id);
    return !altLooksWrong(c.alt, subject);
  });
  const right = usable.filter((c) => altLooksRight(c.alt, subject));
  const rest = usable.filter((c) => !altLooksRight(c.alt, subject));
  const rotate = <T,>(list: T[]) => (list.length ? [...list.slice(seed % list.length), ...list.slice(0, seed % list.length)] : list);
  return [...rotate(right), ...rotate(rest)];
}

export async function pickImage(options: PickOptions): Promise<PickedImage | null> {
  const { subject, topic, exclude, deadlineMs, allowDescriptionOnly } = options;
  const log = options.log ?? [];
  const queries = (options.queries?.length ? options.queries : subject.queries).slice(0, MAX_QUERIES);
  let visionWorked = false;

  for (const query of queries) {
    if (deadlineMs - Date.now() < 6000) {
      log.push('stopped looking for pictures: out of time');
      break;
    }
    const found = await searchImages(query);
    const ranked = rankCandidates(found, subject, exclude, options.seed ?? 0);
    if (ranked.length === 0) {
      log.push(`${query}: no usable photos`);
      continue;
    }

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const batch = ranked.slice(round * BATCH, round * BATCH + BATCH);
      if (batch.length === 0) break;
      if (deadlineMs - Date.now() < 6000) break;

      const verdicts = await Promise.all(
        batch.map((c) => verifyImage({ thumbUrl: c.thumb, subject, topic, deadlineMs }))
      );

      for (let i = 0; i < batch.length; i++) {
        const v = verdicts[i];
        if (v.checked) visionWorked = true;
        if (v.checked && v.ok && !exclude.has(batch[i].id)) {
          exclude.add(batch[i].id);
          log.push(`picture accepted (${batch[i].source}, checked by ${v.provider ?? 'AI'}): ${v.description}`);
          return {
            url: batch[i].url,
            alt: v.description || batch[i].alt || subject.label,
            source: batch[i].source,
            verified: 'vision',
          };
        }
        if (v.checked && !v.ok) log.push(`picture rejected (${batch[i].source}): ${v.reason}`);
      }

      // Nobody could look at the pictures: fall back to the photo descriptions.
      if (!visionWorked && allowDescriptionOnly) {
        const described = batch.find((c) => altLooksRight(c.alt, subject) && !exclude.has(c.id));
        if (described) {
          exclude.add(described.id);
          log.push(`the picture check was not available; used a photo described as: ${described.alt}`);
          return { url: described.url, alt: described.alt, source: described.source, verified: 'description' };
        }
      }
    }
  }
  return null;
}

// Plain words for photo searches.
const NOUN: Record<string, string> = {
  chicken: 'chickens',
  dairy: 'dairy cows',
  cattle: 'cattle',
  goat: 'goats',
  sheep: 'sheep',
  pig: 'pigs',
  dog: 'dogs',
  cat: 'cats',
  livestock: 'farm animals',
};

// A search phrase that fits what the section is about, or null for a general one.
export function headingQuery(heading: string, subject: Subject): string | null {
  const noun = NOUN[subject.key] ?? 'farm animals';
  const h = heading.toLowerCase();
  if (/sign|symptom|spot|look for|recogni/.test(h)) return `sick ${noun}`;
  if (/treat|vet|care for|diagnos/.test(h)) return `veterinarian examining ${noun}`;
  if (/prevent|vaccin|biosecurity|protect/.test(h)) return `vaccinating ${noun}`;
  if (/feed|nutrition|diet/.test(h)) return `${noun} feeding`;
  if (/hous|shed|barn|ventilat|coop/.test(h)) return `${noun} housing`;
  if (/water/.test(h)) return `${noun} drinking water`;
  return null;
}

export interface ArticleImages {
  hero: PickedImage | null;
  /** Photo for each section heading that got one, keyed by the heading text. */
  sections: Map<string, PickedImage>;
  log: string[];
}

export async function pickArticleImages(input: {
  subject: Subject;
  topic: string;
  headings: string[];
  deadlineMs: number;
  seed?: number;
}): Promise<ArticleImages> {
  const exclude = new Set<string>();
  const log: string[] = [];
  const sections = new Map<string, PickedImage>();
  const base = { subject: input.subject, topic: input.topic, exclude, deadlineMs: input.deadlineMs, log };

  const hero = await pickImage({ ...base, allowDescriptionOnly: true, seed: input.seed ?? 0 });
  // No point decorating an article that has no verified lead picture.
  if (!hero) return { hero: null, sections, log };

  const generic = input.subject.queries;
  for (let i = 0; i < input.headings.length; i++) {
    if (input.deadlineMs - Date.now() < 12000) break;
    const heading = input.headings[i];
    const rotated = [...generic.slice((i + 1) % generic.length), ...generic.slice(0, (i + 1) % generic.length)];
    const specific = headingQuery(heading, input.subject);
    const picked = await pickImage({
      ...base,
      queries: specific ? [specific, ...rotated] : rotated,
      allowDescriptionOnly: true,
      seed: (input.seed ?? 0) + i + 1,
    });
    if (picked) sections.set(heading, picked);
  }
  return { hero, sections, log };
}
