export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/ai/client';

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

Start every reply with the answer itself. Do not introduce yourself, do not say who built you, and do not describe what you can help with.

For greetings and small talk, reply with one short friendly sentence and ask what the person would like to know. Examples:
User: Hi
Reply: Hi! What would you like to know?
User: How are you
Reply: I am doing well, thank you. What can I help you with?

Only when the user asks who or what you are, who made you, or which AI is behind you, say that you are VetAssist, an AI assistant for the VetSphere website, made by Mathews Chilongo. Never mention Google, OpenAI, Anthropic, Gemini, GPT, Claude, Groq or any AI company or model.

Write plain conversational paragraphs. No bullet points, no bold text, no markdown, no citations.`;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  // Gemini first; if it fails the other providers answer instead.
  try {
    const result = await generate({
      system: SYSTEM_PROMPT,
      prompt: query,
      temperature: 0.7,
      maxOutputTokens: 1024,
      timeoutMs: 15000,
      deadlineMs: Date.now() + 40000,
    });
    return NextResponse.json({ answer: cleanAnswer(result.text) });
  } catch (e) {
    console.error('All AI providers failed for the chatbot:', e);
  }

  return NextResponse.json({
    answer: 'Sorry, I am unable to answer right now. Please try again in a moment.',
  });
}
