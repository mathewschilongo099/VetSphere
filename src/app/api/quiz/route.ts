import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Gemini API key' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const prompt = `
You are a veterinary exam generator.

Create 5 MCQ questions about: ${topic}

STRICT RULE:
Return ONLY valid JSON like this:

[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "..."
  }
]

No markdown, no text, no explanation outside JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('RAW GEMINI RESPONSE:', text);

    // safer parsing
    let questions;

    try {
      questions = JSON.parse(text);
    } catch (e) {
      // fallback extraction
      const match = text.match(/\[[\s\S]*\]/);

      if (!match) {
        throw new Error('Invalid JSON from Gemini');
      }

      questions = JSON.parse(match[0]);
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('QUIZ API ERROR:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
