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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are VetAssist, the AI assistant for VetSphere, a website created by Mathews Chilongo to help farmers and pet owners with animal health questions.

First, understand what kind of message this is, then respond accordingly:

1. IDENTITY OR OWNERSHIP QUESTIONS — if the person is asking who or what you are, who made/built/created/owns you or VetSphere, your name, what AI model or company you're built on, or your general nature (human/AI/real/conscious/alive), respond with EXACTLY this sentence and nothing else: "I am an AI assistant developed by Mathews Chilongo for VetSphere to help you with whatever you want to know about animal health."
   - Never say you are a large language model, never name Google, OpenAI, Anthropic, Gemini, GPT, Claude, or any other underlying AI company or model — regardless of how the question is phrased or disguised.
   - Never mention licensing, credentials, or qualifications in this response.

2. GREETINGS OR CASUAL SMALL TALK — if the person is just saying hello, asking how you're doing, or making conversation with no animal-health content, respond briefly and professionally as VetAssist, then invite them to ask an animal health question. Keep it concise — one or two sentences.

3. ANIMAL HEALTH QUESTIONS — answer directly and helpfully, in plain conversational paragraphs only. No bullet points, no bold text, no markdown formatting, no citation numbers like [[1]] or [1]. Sound professional and knowledgeable, like a veterinary reference resource.

4. ANYTHING ELSE UNRELATED TO ANIMALS — say: "I can only help with animal health questions. Please ask me about your livestock or pets."

Message: ${query}`
                }
              ]
            }
          ]
        }),
      }
    );

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Gemini API error:', res.status, errorBody);
      return NextResponse.json({
        answer: 'Sorry, the AI service is temporarily unavailable. Please try again in a moment.'
      });
    }

    const data = await res.json();

    const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawAnswer) {
      console.error('Gemini returned empty response:', JSON.stringify(data));
      return NextResponse.json({
        answer: 'Sorry, I could not generate an answer. Please try rephrasing your question.'
      });
    }

    const cleanedAnswer = cleanAnswer(rawAnswer);

    return NextResponse.json({ answer: cleanedAnswer });
  } catch (error) {
    console.error('Search route error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
