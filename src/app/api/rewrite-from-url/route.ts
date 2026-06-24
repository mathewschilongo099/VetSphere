import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { url, topic } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Step 1: Fetch the content from the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VetSphereBot/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: response.status }
      );
    }

    const html = await response.text();

    // Step 2: Extract the article title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : topic || 'Veterinary Article';

    // Step 3: Extract text content (remove HTML tags)
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    if (textContent.length < 200) {
      return NextResponse.json(
        { error: 'Could not extract enough content from the URL. Please try a different article.' },
        { status: 400 }
      );
    }

    // Step 4: Use Gemini to rewrite the content
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the latest available model
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-exp' });

    const prompt = `
You are an expert veterinary SEO writer. Based on the following source content, create a NEW, ORIGINAL, and COMPLETELY REWRITTEN veterinary article.

Source Title: ${extractedTitle}
Source Content:
${textContent}

Create a new article with this structure:
## Introduction
## What is [topic]?
## Causes
## Clinical Signs and Symptoms
## How to Diagnose
## Treatment
## Prevention and Control
## Frequently Asked Questions
## When to Call a Veterinarian
## Conclusion

RULES:
- Make it 1500+ words
- Use simple English for farmers and students
- Include at least 5 FAQs
- DO NOT copy sentences directly from the source
- Rewrite everything in your own words
- Add new insights and examples where possible
- Make it SEARCH ENGINE OPTIMIZED
- Use relevant keywords naturally
- NO citations
- NO references section
- NO images or image descriptions
- NO markdown formatting except headings

Return ONLY the article content in plain text format.
`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content || content.trim().length < 200) {
      return NextResponse.json(
        { error: 'Generated content is too short. Please try again.' },
        { status: 500 }
      );
    }

    // Step 5: Clean up any markdown that might have been added
    const cleanContent = content
      .replace(/```markdown/g, '')
      .replace(/```/g, '')
      .trim();

    return NextResponse.json({
      success: true,
      title: extractedTitle,
      content: cleanContent,
      sourceUrl: url,
      sourceTitle: extractedTitle,
    });

  } catch (error) {
    console.error('Error rewriting from URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process URL' },
      { status: 500 }
    );
  }
}
