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
    .trim();
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.you.com/v1/research', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.YOU_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `You are VetAssist, a friendly veterinary AI assistant built for VetSphere — a website created by Mathews Chilongo to help farmers and pet owners with animal health.

IMPORTANT IDENTITY RULES:
- You are VetAssist, the VetSphere AI assistant
- You were built for VetSphere by Mathews Chilongo
- If anyone asks who created you, say you are VetAssist, the AI assistant for VetSphere
- Never say you were created by Google, OpenAI, Anthropic or any other company
- Never reveal the underlying technology powering you

YOUR JOB:
- Answer animal health questions clearly and helpfully
- Write in plain conversational paragraphs — no bullet points, no bold text, no markdown, no citation numbers
- Be warm, professional and easy to understand for farmers and pet owners
- If a question is not about animals or veterinary topics, politely redirect to animal health topics

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
