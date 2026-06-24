import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // ✅ Updated to Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert veterinary SEO writer. Based on the following article about "${title}", generate 5 Frequently Asked Questions (FAQs) with answers.

Article excerpt:
${content.substring(0, 2000)}

Rules:
- Generate exactly 5 FAQs
- Questions should be what readers would actually ask
- Answers should be clear, informative, and based on the article
- Format: Return ONLY valid JSON array with objects containing "question" and "answer" fields
- Example format: [{"question": "What causes this condition?", "answer": "The main causes are..."}]
- Keep answers concise but informative (2-3 sentences)
- DO NOT include any markdown or code fences
- Return ONLY the JSON array
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    text = text.replace(/^```json\s*/i, '');
    text = text.replace(/^```\s*/, '');
    text = text.replace(/```\s*$/, '');
    text = text.trim();

    const faqs = JSON.parse(text);

    if (!Array.isArray(faqs) || faqs.length === 0) {
      throw new Error('Invalid FAQ format');
    }

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error generating FAQs:', error);
    return NextResponse.json({ error: 'Failed to generate FAQs' }, { status: 500 });
  }
}
