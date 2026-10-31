import { NextRequest, NextResponse } from 'next/server';
import { callGemini, GeminiError, publicGeminiMessage } from '@/lib/pipeline/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 20000; // only the first 2000 characters are sent to the model

interface Faq {
  question: string;
  answer: string;
}

// Small per-instance cache so repeated views of the same article do not each
// spend a Gemini request. (Best effort: serverless instances do not share it.)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, { faqs: Faq[]; expires: number }>();

function cacheKey(title: string, excerpt: string): string {
  return `${title}\n${excerpt.slice(0, 200)}`;
}

function parseFaqs(raw: string): Faq[] {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON array in response');
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error('Invalid FAQ format');
  const faqs = parsed
    .filter(
      (item): item is Faq =>
        item && typeof item.question === 'string' && typeof item.answer === 'string'
    )
    .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
    .filter((item) => item.question && item.answer)
    .slice(0, 5);
  if (faqs.length === 0) throw new Error('Invalid FAQ format');
  return faqs;
}

export async function POST(request: NextRequest) {
  let body: { content?: unknown; title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, title } = body;
  if (typeof content !== 'string' || typeof title !== 'string' || !content.trim() || !title.trim()) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }
  if (title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: 'title or content is too long' }, { status: 400 });
  }

  const key = cacheKey(title, content);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json({ faqs: hit.faqs });
  }

  try {
    const prompt = `
You are an expert veterinary content writer. Based on the following article about "${title}", generate 5 Frequently Asked Questions (FAQs) with answers.

Article excerpt:
${content.substring(0, 2000)}

Rules:
- Generate exactly 5 FAQs
- Questions should be what readers would actually ask
- Answers should be clear, informative, and based only on the article excerpt; do not add new medical claims, doses or treatments that the excerpt does not contain
- Where an answer touches on diagnosis or treatment of a sick animal, tell the reader to consult a qualified veterinarian
- Format: Return ONLY valid JSON array with objects containing "question" and "answer" fields
- Example format: [{"question": "What causes this condition?", "answer": "The main causes are..."}]
- Keep answers concise but informative (2-3 sentences)
- DO NOT include any markdown or code fences
- Return ONLY the JSON array
`;

    const result = await callGemini({
      prompt,
      json: true,
      maxOutputTokens: 1500,
      thinkingLevel: 'low',
      timeoutMs: 25000,
    });

    const faqs = parseFaqs(result.text);

    if (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { faqs, expires: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error(
      'Error generating FAQs:',
      error instanceof GeminiError ? `${error.kind} (${error.status ?? 'n/a'})` : error instanceof Error ? error.message : 'unknown'
    );
    const status = error instanceof GeminiError && error.kind === 'rate_limited' ? 429 : 502;
    return NextResponse.json({ error: publicGeminiMessage(error) }, { status });
  }
}
