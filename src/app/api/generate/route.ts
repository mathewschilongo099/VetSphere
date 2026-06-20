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
        input: `Write a long, detailed, professional veterinary article about: ${topic}.

Requirements:
- Minimum 800 words
- Use these sections with markdown headings: Introduction, Causes, Clinical Signs and Symptoms, Diagnosis, Treatment, Prevention and Control, Conclusion
- Write in clear simple English for farmers, students and pet owners
- Do NOT include citation numbers like [[1]] or [[2]] anywhere in the text
- Do NOT include a references section
- Make each section at least 2-3 paragraphs long
- Sound professional like a veterinary textbook`,
        research_effort: 'standard',
      }),
    });

    const data = await res.json();
    let content = data.output?.content || '';

    // Remove citation numbers like [[1, 2]] or [[3]]
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

    const title = topic.charAt(0).toUpperCase() + topic.slice(1);

    return NextResponse.json({ content, title });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
