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

const IDENTITY_KEYWORDS = [
  'who are you', 'what are you', 'who created you', 'who made you',
  'who built you', 'your name', 'introduce yourself', 'about you',
  'who is mathews', 'tell me about yourself'
];

function isIdentityQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return IDENTITY_KEYWORDS.some(k => lower.includes(k));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Handle identity questions directly without calling the API
  if (isIdentityQuestion(query)) {
    return NextResponse.json({
      answer: 'I am VetAssist, the AI assistant for VetSphere. VetSphere was created by Mathews Chilongo to help farmers and pet owners with animal health questions. How can I help you today?'
    });
  }

  try {
    const res = await fetch('https://api.you.com/v1/research', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.YOU_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `You are a veterinary assistant. Answer the following animal health question directly and helpfully.

STRICT RULES:
- Answer the question directly — do not introduce yourself
- Do not mention VetAssist, VetSphere, or Mathews Chilongo in your answer
- No bullet points, no bold text, no markdown formatting
- No citation numbers like [[1]] or [1]
- Write in plain conversational paragraphs only
- Be warm and professional for farmers and pet owners
- If not about animals, say: "I can only help with animal health questions. Please ask me about your livestock or pets."

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
