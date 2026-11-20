import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

interface Q {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const DIFFICULTY_HINT: Record<string, string> = {
  easy: 'basic facts and definitions',
  medium: 'practical, real-world farm and clinic situations',
  hard: 'clinical reasoning, differential diagnosis and advanced management',
};

// ---- Basic rate limit (best effort, per server instance) -------------
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 500) {
    hits.forEach((times, key) => {
      if (!times.some((t) => now - t < 60_000)) hits.delete(key);
    });
  }
  return recent.length > 8;
}

// ---- Helpers ---------------------------------------------------------
function sanitize(text: unknown, max: number): string {
  return String(text ?? '')
    .replace(/[\u0000-\u001f"`\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// Keeps only well-formed questions and shuffles the answer order so the
// correct answer is not always in the same position.
function cleanQuestions(raw: unknown, count: number): Q[] {
  if (!Array.isArray(raw)) return [];
  const out: Q[] = [];

  for (const item of raw) {
    const q = item as Partial<Q> | null;
    if (!q || typeof q.question !== 'string' || !q.question.trim()) continue;
    if (!Array.isArray(q.options) || q.options.length !== 4) continue;
    if (!q.options.every((o) => typeof o === 'string' && o.trim())) continue;
    if (q.options.filter((o, i, a) => a.indexOf(o) === i).length !== 4) continue;
    if (typeof q.correctIndex !== 'number' || !Number.isInteger(q.correctIndex)) continue;
    if (q.correctIndex < 0 || q.correctIndex > 3) continue;

    const correct = q.options[q.correctIndex];
    const options = shuffle(q.options);
    out.push({
      question: q.question.trim(),
      options,
      correctIndex: options.indexOf(correct),
      explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
    });
  }

  return out.slice(0, count);
}

function parseQuestions(text: string, count: number): Q[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return cleanQuestions(JSON.parse(match[0]), count);
  } catch {
    return [];
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const topic = sanitize(body?.topic, 80);
  if (!topic) {
    return NextResponse.json({ error: 'Please enter a topic.' }, { status: 400 });
  }

  const count = Math.min(15, Math.max(3, Math.floor(Number(body?.count)) || 5));
  const difficulty = DIFFICULTY_HINT[body?.difficulty] ? (body.difficulty as string) : 'medium';
  const avoid: string[] = Array.isArray(body?.avoid)
    ? body.avoid.slice(0, 30).map((s: unknown) => sanitize(s, 160)).filter(Boolean)
    : [];

  const prompt = `Create ${count} multiple choice veterinary questions about "${topic}" for farmers, veterinary students and pet owners.
Difficulty: ${difficulty} (${DIFFICULTY_HINT[difficulty]}).

Rules:
- Exactly 4 options per question and exactly one correct answer.
- Vary which option is correct.
- Explanation: 1-2 short sentences saying why the answer is correct.
- Only ask about ${topic}.${
    avoid.length ? `\n- Do NOT repeat or rephrase any of these earlier questions:\n${avoid.map((q) => `  * ${q}`).join('\n')}` : ''
  }

Return ONLY a valid JSON array, no markdown and no extra text:
[{"question":"string","options":["A","B","C","D"],"correctIndex":0,"explanation":"string"}]`;

  const minimum = Math.ceil(count / 2);
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. Groq (primary)
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 4000,
      });
      const questions = parseQuestions(completion.choices[0]?.message?.content || '', count);
      if (questions.length >= minimum) {
        return NextResponse.json({ questions, source: 'groq' });
      }
    } catch (err) {
      console.log('Groq failed, switching to OpenRouter...', err);
    }
  }

  // 2. OpenRouter (fallback)
  if (openRouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 4000,
        }),
      });
      const data = await res.json();
      const questions = parseQuestions(data.choices?.[0]?.message?.content || '', count);
      if (questions.length >= minimum) {
        return NextResponse.json({ questions, source: 'openrouter' });
      }
    } catch (err) {
      console.log('OpenRouter failed.', err);
    }
  }

  // 3. No placeholder questions: tell the user clearly instead.
  return NextResponse.json(
    { error: 'Could not generate the quiz right now. Please try again in a moment.' },
    { status: 503 }
  );
}
