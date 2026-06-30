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

    // ✅ FIXED MODEL (updated from gemini-1.5-flash)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const prompt = `
You are a veterinary exam generator.

Create 5 multiple-choice questions about: ${topic}

STRICT RULE:
Return ONLY valid JSON in this format:

[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "string"
  }
]

No markdown, no extra text, only JSON array.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('RAW GEMINI RESPONSE:', text);

    let questions;

    try {
      // try direct parsing first
      questions = JSON.parse(text);
    } catch (err) {
      // fallback extraction if Gemini adds extra text
      const match = text.match(/\[[\s\S]*\]/);

      if (!match) {
        throw new Error('Gemini did not return valid JSON');
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
