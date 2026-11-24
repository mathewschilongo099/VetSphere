export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/pipeline/gemini';

const MAX_QUERY_LENGTH = 500;
// How much of the conversation is sent to the AI. Older messages are dropped
// so cost and speed stay under control.
const MAX_HISTORY_MESSAGES = 12;
const MAX_TURN_LENGTH = 2000;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function cleanAnswer(text: string): string {
  return text
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[\*\-]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SYSTEM_PROMPT = `You are VetAssist, a helpful assistant on the VetSphere website, which was created by Mathews Chilongo. You are especially good at animal health, livestock and pet care, but you answer any question helpfully, including general topics such as science, school subjects and computer science. Never refuse a topic only because it is not about animals. Never invent services, products or features of VetSphere.

You remember the conversation. When the user sends a follow-up such as "what about its treatment?" or "and for goats?", use the earlier messages to understand what they mean, and use details they already shared (the animal, its age, symptoms, location) without asking for them again.

Start every reply with the answer itself. Do not introduce yourself, do not say who built you, and do not describe what you can help with.

For greetings and small talk, reply with one short friendly sentence and ask what the person would like to know. Examples:
User: Hi
Reply: Hi! What would you like to know?
User: How are you
Reply: I am doing well, thank you. What can I help you with?

Only when the user asks who or what you are, who made you, or which AI is behind you, say that you are VetAssist, an AI assistant for the VetSphere website, made by Mathews Chilongo. Never mention Google, OpenAI, Anthropic, Gemini, GPT, Claude, Groq or any AI company or model.

For questions about animal health, give general educational information only. You cannot diagnose or prescribe. When a question describes a sick or injured animal, or asks about medicines or doses, say clearly that a qualified veterinarian or animal health professional needs to examine the animal, and say so early in the answer if the situation sounds urgent.

Write plain conversational paragraphs. No bullet points, no bold text, no markdown, no citations.`;

// Turns the conversation into one text block for providers that take a single
// prompt (Gemini helper, You.com).
function toTranscript(history: ChatTurn[]): string {
  const lines = history.map((t) => `${t.role === 'user' ? 'User' : 'VetAssist'}: ${t.content}`);
  return `Conversation so far:\n${lines.join('\n')}\n\nReply to the user's latest message. Use the earlier messages for context. Do not repeat earlier answers.`;
}

function toPrompt(history: ChatTurn[]): string {
  return history.length === 1 ? history[0].content : toTranscript(history);
}

async function askGemini(history: ChatTurn[]): Promise<string> {
  const result = await callGemini({
    system: SYSTEM_PROMPT,
    prompt: toPrompt(history),
    maxOutputTokens: 1024,
    thinkingLevel: 'low',
    timeoutMs: 25000,
  });
  return result.text;
}

async function askGroq(history: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((t) => ({ role: t.role, content: t.content })),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq failed: ${res.status}`);
  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content || '';
  if (!answer) throw new Error('Groq empty response');
  return answer;
}

async function askYouCom(history: ChatTurn[]): Promise<string> {
  const res = await fetch('https://api.you.com/v1/research', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.YOU_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: `${SYSTEM_PROMPT}\n\n${history.length === 1 ? `Question: ${history[0].content}` : toTranscript(history)}`,
      research_effort: 'lite',
    }),
  });
  if (!res.ok) throw new Error(`You.com failed: ${res.status}`);
  const data = await res.json();
  const answer = data?.output?.content || '';
  if (!answer) throw new Error('You.com empty response');
  return answer;
}

// Tries Gemini, then Groq, then You.com.
async function answerFromHistory(history: ChatTurn[]): Promise<NextResponse> {
  try {
    const answer = await askGemini(history);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('Gemini failed:', e instanceof Error ? e.message : 'unknown error');
  }

  try {
    const answer = await askGroq(history);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('Groq failed:', e instanceof Error ? e.message : 'unknown error');
  }

  try {
    const answer = await askYouCom(history);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('You.com failed:', e instanceof Error ? e.message : 'unknown error');
  }

  return NextResponse.json({
    answer: 'Sorry, I am unable to answer right now. Please try again in a moment.',
  });
}

// Validates the conversation sent by the browser. Returns null when invalid.
function parseHistory(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null;
  const turns: ChatTurn[] = [];
  for (const item of raw.slice(-MAX_HISTORY_MESSAGES)) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null;
    const text = content.trim();
    if (!text) continue;
    turns.push({ role, content: text.slice(0, MAX_TURN_LENGTH) });
  }
  // The conversation must start with and end with a user message.
  while (turns.length > 0 && turns[0].role !== 'user') turns.shift();
  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') return null;
  return turns;
}

// Single question without history (used by the animal search box).
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query is too long (maximum ${MAX_QUERY_LENGTH} characters)` },
      { status: 400 }
    );
  }

  return answerFromHistory([{ role: 'user', content: query }]);
}

// Chat with memory: the browser sends the recent conversation each time.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const history = parseHistory((body as { messages?: unknown } | null)?.messages);
  if (!history) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 });
  }
  if (history[history.length - 1].content.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query is too long (maximum ${MAX_QUERY_LENGTH} characters)` },
      { status: 400 }
    );
  }

  return answerFromHistory(history);
}
