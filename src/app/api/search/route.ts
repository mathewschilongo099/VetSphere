export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { generate } from '@/lib/ai/client';

const MAX_QUERY_LENGTH = 500;

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

For questions about animal health, give general educational information only. You cannot diagnose or prescribe. When a question describes a sick or injured animal, or asks about medicines or doses, say clearly that a qualified veterinarian or animal health professional needs to examine the animal, and say so early in the answer if the situation sounds urgent.

Write plain conversational paragraphs. No bullet points, no bold text, no markdown, no citations.`;

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

  // Gemini first; if it fails Groq, Cerebras, OpenRouter and You.com answer instead.
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
    console.error('All AI providers failed for the chatbot:', e instanceof Error ? e.message : 'unknown error');
  }

  return NextResponse.json({
    answer: 'Sorry, I am unable to answer right now. Please try again in a moment.',
  });
}
