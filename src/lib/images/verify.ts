// Looks at a picture with an AI that can see, and decides whether it really
// shows the animal the article is about. If every vision AI is unavailable the
// answer is "not checked", never "fine".

import { generate, AllProvidersFailed } from '@/lib/ai/client';
import { extractJson } from '@/lib/pipeline/gemini';
import type { Subject } from './subjects';

export interface ImageVerdict {
  checked: boolean;
  ok: boolean;
  reason: string;
  /** Short description of the picture, used as its alt text. */
  description: string;
  provider?: string;
}

const MAX_BYTES = 3_000_000;

export async function fetchImageBytes(
  url: string,
  timeoutMs = 9000
): Promise<{ mime: string; base64: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`picture download failed (HTTP ${res.status})`);
    const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
      throw new Error(`unsupported picture type "${mime || 'unknown'}"`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_BYTES) throw new Error('picture is empty or too large');
    return { mime, base64: buffer.toString('base64') };
  } finally {
    clearTimeout(timer);
  }
}

export const IMAGE_JUDGE_SYSTEM = `You check photos for a veterinary information website before they are published. Be strict: a wrong animal in a picture misleads readers.
Describe only what you can actually see.`;

export function buildImagePrompt(subject: Subject, topic: string): string {
  return `The article is about: ${topic}
The picture must clearly show: ${subject.label}

Look at the photo and answer with ONLY this JSON:
{"subject_matches": true or false,
 "main_subject": "what the photo mainly shows, 2 to 6 words",
 "wrong_animal_prominent": true or false,
 "is_illustration_or_graphic": true or false,
 "has_text_logo_or_watermark": true or false,
 "sharp_and_well_lit": true or false,
 "alt_text": "a plain description of the photo, 6 to 14 words, no quotes"}

"subject_matches" is true only if ${subject.label} are clearly visible and are the main subject.
"wrong_animal_prominent" is true if any other kind of animal (for example a dog, cat, cow, goat or pig that is not ${subject.label}) is a main subject.`;
}

export function judgeVerdict(raw: unknown): { ok: boolean; reason: string; description: string } {
  const v = (raw ?? {}) as Record<string, unknown>;
  const description = String(v.alt_text ?? v.main_subject ?? '')
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
  const problems: string[] = [];
  if (v.subject_matches !== true) problems.push(`does not clearly show the right animal (it shows: ${String(v.main_subject ?? 'unknown')})`);
  if (v.wrong_animal_prominent === true) problems.push('a different animal is prominent');
  if (v.is_illustration_or_graphic === true) problems.push('it is an illustration or graphic');
  if (v.has_text_logo_or_watermark === true) problems.push('it has text, a logo or a watermark');
  if (v.sharp_and_well_lit === false) problems.push('it is blurry or poorly lit');
  return { ok: problems.length === 0, reason: problems.join('; ') || 'matches', description };
}

export async function verifyImage(input: {
  thumbUrl: string;
  subject: Subject;
  topic: string;
  deadlineMs?: number;
}): Promise<ImageVerdict> {
  let image: { mime: string; base64: string };
  try {
    image = await fetchImageBytes(input.thumbUrl);
  } catch (error) {
    return {
      checked: true,
      ok: false,
      reason: error instanceof Error ? error.message : 'could not download the picture',
      description: '',
    };
  }

  try {
    const result = await generate({
      system: IMAGE_JUDGE_SYSTEM,
      prompt: buildImagePrompt(input.subject, input.topic),
      images: [image],
      json: true,
      temperature: 0,
      maxOutputTokens: 400,
      timeoutMs: 20000,
      deadlineMs: input.deadlineMs,
    });
    const verdict = judgeVerdict(extractJson(result.text));
    return { checked: true, ...verdict, provider: result.provider };
  } catch (error) {
    if (error instanceof AllProvidersFailed) {
      return { checked: false, ok: false, reason: 'no AI that can see pictures was available', description: '' };
    }
    return {
      checked: false,
      ok: false,
      reason: error instanceof Error ? error.message : 'picture check failed',
      description: '',
    };
  }
}
