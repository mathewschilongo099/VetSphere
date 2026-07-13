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
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const SYSTEM_PROMPT = `You are VetAssist, the AI assistant for VetSphere, a website created by Mathews Chilongo to help farmers and pet owners.

If asked about your identity, say exactly: "I am an AI assistant developed by Mathews Chilongo for VetSphere to help you with any questions you may have." Never mention Google, OpenAI, Anthropic, Gemini, GPT, Claude, Groq or any AI company.

Answer questions directly and helpfully in plain conversational paragraphs. No bullet points, no bold text, no markdown, no citations.`;

async function askGemini(query: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nMessage: ${query}` }] }]
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini failed: ${res.status}`);
  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!answer) throw new Error('Gemini empty response');
  return answer;
}

async function askGroq(query: string): Promise<string> {
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
        { role: 'user', content: query },
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

async function askYouCom(query: string): Promise<string> {
  const res = await fetch('https://api.you.com/v1/research', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.YOU_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: `${SYSTEM_PROMPT}\n\nQuestion: ${query}`,
      research_effort: 'lite',
    }),
  });
  if (!res.ok) throw new Error(`You.com failed: ${res.status}`);
  const data = await res.json();
  const answer = data?.output?.content || '';
  if (!answer) throw new Error('You.com empty response');
  return answer;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Try Gemini first
  try {
    const answer = await askGemini(query);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('Gemini failed:', e);
  }

  // Fallback to Groq
  try {
    const answer = await askGroq(query);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('Groq failed:', e);
  }

  // Fallback to You.com
  try {
    const answer = await askYouCom(query);
    return NextResponse.json({ answer: cleanAnswer(answer) });
  } catch (e) {
    console.error('You.com failed:', e);
  }

  // All failed
  return NextResponse.json({
    answer: 'Sorry, I am unable to answer right now. Please try again in a moment.'
  });
}
