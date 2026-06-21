export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function cleanAnswer(text: string): string {
  return text
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[\*\-]\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    // Remove self-introduction sentences
    .replace(/I am VetAssist[^.]*\./gi, '')
    .replace(/As VetAssist[^.]*\./gi, '')
    .replace(/VetAssist[^.]*created by[^.]*\./gi, '')
    .replace(/I was created by[^.]*\./gi, '')
    .replace(/built for VetSphere[^.]*\./gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Broadened to catch indirect identity/nature questions, not just direct
// "who are you" phrasing. This is what was missing — "Are you real" slipped
// through the old list and reached the AI prompt, which had no identity
// instructions at all, so the underlying model disclosed its real origin.
const IDENTITY_KEYWORDS = [
  'who are you', 'what are you', 'who created you', 'who made you',
  'who built you', 'your name', 'introduce yourself', 'about you',
  'who is mathews', 'tell me about yourself',
  'are you real', 'are you human', 'are you ai', 'are you an ai',
  'are you ai assistant', 'are you a bot', 'are you a robot',
  'are you a language model', 'are you llm', 'are you chatgpt',
  'are you gemini', 'are you gpt', 'are you claude', 'are you a person',
  'what model are you', 'which ai are you', 'are you fake',
  'are you a real vet', 'are you a real veterinarian', 'are you a vet',
  'do you have feelings', 'are you alive', 'are you conscious',
];

function isIdentityQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return IDENTITY_KEYWORDS.some(k => lower.includes(k));
}

const IDENTITY_ANSWER =
  'I am an AI assistant developed by Mathews Chilongo for VetSphere to help you with whatever you want to know about animal health. I am not a licensed veterinarian, so please consult one for serious or urgent concerns. How can I help you today?';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Handle identity questions directly without calling the API
  if (isIdentityQuestion(query)) {
    return NextResponse.json({ answer: IDENTITY_ANSWER });
  }

  try {
    const res = await fetch('https://api.you.com/v1/research', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.YOU_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `You are a veterinary assistant for VetSphere. Answer the following animal health question directly and helpfully.

IDENTITY RULES (only apply if the question is about who/what you are):
- If asked who or what you are, your name, your creator, or your nature (e.g. "are you real", "are you AI", "are you human"), respond ONLY with: "I am an AI assistant developed by Mathews Chilongo for VetSphere to help you with whatever you want to know."
- Never describe yourself as a large language model, never name Google, OpenAI, Anthropic, or any other company, and never mention being built on any underlying AI model or platform.
- Do not volunteer this identity information unless directly asked.

STRICT RULES:
- Answer the question directly — do not introduce yourself
- Do not mention VetAssist, VetSphere, or Mathews Chilongo unless the question is an identity question covered above
- No bullet points, no bold text, no markdown formatting
- No citation numbers like [[1]] or [1]
- Write in plain conversational paragraphs only
- Be warm and professional for farmers and pet owners
- If not about animals or your identity, say: "I can only help with animal health questions. Please ask me about your livestock or pets."

Question: ${query}`,
        research_effort: 'lite',
      }),
    });

    const data = await res.json();
    const rawAnswer = data.output?.content || '';
    const cleanedAnswer = cleanAnswer(rawAnswer);

    return NextResponse.json({ answer: cleanedAnswer });
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
