import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic required' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.you.com/v1/research', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.YOU_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `Write a detailed, professional veterinary article about: ${topic}. Include an introduction, causes, symptoms, treatment, and prevention sections. Write in simple English for farmers and pet owners.`,
        research_effort: 'lite',
      }),
    });

    const data = await res.json();
    const content = data.output?.content || '';
    const title = topic.charAt(0).toUpperCase() + topic.slice(1);

    return NextResponse.json({ content, title });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
