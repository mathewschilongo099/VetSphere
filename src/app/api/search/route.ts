import { NextRequest, NextResponse } from 'next/server';

function cleanAnswer(text: string): string {
  return text
    // Remove citation numbers like [[1, 2]] or [[3]]
    .replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '')
    .replace(/\[\d+(?:,\s*\d+)*\]/g, '')
    // Remove markdown bold **text**
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove markdown italic *text*
    .replace(/\*(.*?)\*/g, '$1')
    // Remove markdown bullet points
    .replace(/^\s*[\*\-]\s+/gm, '')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Clean up extra blank lines
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
        input: `You are a friendly veterinary assistant on VetSphere, a website for farmers and pet owners. 
Answer this question in a clear, conversational way as if talking to a farmer or pet owner.
Do NOT use bullet points, markdown formatting, bold text, or citation numbers.
Write in plain paragraphs. Be helpful, warm and professional.
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
