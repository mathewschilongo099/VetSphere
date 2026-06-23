export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function getUnsplashImage(query: string): Promise<string> {
  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;

    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${randomPage}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) return '';

    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex]?.urls?.regular || '';
  } catch {
    return '';
  }
}

// Gemini often wraps JSON in markdown code fences even when told not to.
// Strip those before parsing so the SEO keyword step doesn't silently fall
// back to empty data on every single run.
function extractJson(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
}

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic required' }, { status: 400 });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Gemini API key' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
    });

    // =========================
    // SEO KEYWORD ENGINE
    // =========================
    const seoPrompt = `
Return ONLY valid JSON, with no markdown code fences and no extra commentary.

Topic: "${topic}"

{
  "primary_keyword": "${topic}",
  "secondary_keywords": ["animal health", "veterinary care"],
  "long_tail_keywords": [
    "how to treat ${topic}",
    "symptoms of ${topic}",
    "prevention of ${topic}"
  ],
  "search_intent": "informational",
  "questions": [
    "What causes ${topic}?",
    "How is ${topic} treated?",
    "Can ${topic} be prevented?"
  ]
}
`;

    let seo;
    try {
      const seoResult = await model.generateContent(seoPrompt);
      const seoResponse = await seoResult.response;
      const seoText = extractJson(seoResponse.text());
      seo = JSON.parse(seoText);
    } catch (seoError) {
      console.error('SEO keyword step failed:', seoError);
      seo = {
        primary_keyword: topic,
        secondary_keywords: [],
        long_tail_keywords: [],
        search_intent: "informational",
        questions: []
      };
    }

    // =========================
    // BLOG GENERATION
    // =========================
    const prompt = `
You are an expert veterinary SEO writer.

PRIMARY KEYWORD: ${seo.primary_keyword}
SECONDARY KEYWORDS: ${seo.secondary_keywords.join(', ')}
LONG TAIL KEYWORDS: ${seo.long_tail_keywords.join(', ')}
SEARCH INTENT: ${seo.search_intent}

Write a 1500+ word SEO blog about: "${topic}"

STRICT STRUCTURE:
## Introduction
## What is ${topic}?
## Causes of ${topic}
## Clinical Signs and Symptoms of ${topic}
## How to Diagnose ${topic}
## Treatment of ${topic}
## Prevention and Control of ${topic}
## Frequently Asked Questions About ${topic}
## When to Call a Veterinarian
## Conclusion

RULES:
- Use simple English for farmers and students
- Naturally include keywords
- Include at least 5 FAQs
- No citations
- No references section
`;

    let content: string;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      content = response.text();
    } catch (genError) {
      console.error('Main article generation failed:', genError);
      throw new Error(
        `Gemini article generation failed: ${genError instanceof Error ? genError.message : 'unknown error'}`
      );
    }

    if (!content || content.trim().length < 200) {
      throw new Error('Gemini returned empty or too-short content');
    }

    // =========================
    // CLEAN TEXT
    // =========================
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

    // =========================
    // SEO DATA
    // =========================
    const plainText = content.replace(/[#*![\]()]/g, '').trim();

    const buildExcerpt = (text: string, maxLength: number): string => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean.length <= maxLength) return clean;
      const truncated = text.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const excerpt = buildExcerpt(plainText, 155);

    const seoTitle =
      topic.charAt(0).toUpperCase() + topic.slice(1) +
      ': Causes, Symptoms, Treatment and Prevention';

    const metaDescription = buildExcerpt(plainText, 160);

    const tags = [
      topic.toLowerCase(),
      ...topic.toLowerCase().split(' ').filter((w: string) => w.length > 3),
      'animal health',
      'veterinary',
      'livestock',
    ].slice(0, 6);

    // =========================
    // UNSPLASH IMAGES
    // =========================
    const heroImage = await getUnsplashImage(topic + ' livestock farm');
    const causesImage = await getUnsplashImage(topic + ' disease');
    const symptomsImage = await getUnsplashImage('sick animal ' + topic);
    const treatmentImage = await getUnsplashImage('veterinarian treatment');
    const preventionImage = await getUnsplashImage('farm biosecurity');

    // =========================
    // IMAGE INJECTION
    // =========================
    if (heroImage) {
      content = content.replace(
        '## Introduction',
        `## Introduction\n\n



![${topic}](${heroImage})



`
      );
    }

    if (causesImage) {
      content = content.replace(
        `## Causes of ${topic}`,
        `## Causes of ${topic}\n\n



![Causes](${causesImage})



`
      );
    }

    if (symptomsImage) {
      content = content.replace(
        `## Clinical Signs and Symptoms of ${topic}`,
        `## Clinical Signs and Symptoms of ${topic}\n\n



![Symptoms](${symptomsImage})



`
      );
    }

    if (treatmentImage) {
      content = content.replace(
        `## Treatment of ${topic}`,
        `## Treatment of ${topic}\n\n



![Treatment](${treatmentImage})



`
      );
    }

    if (preventionImage) {
      content = content.replace(
        `## Prevention and Control of ${topic}`,
        `## Prevention and Control of ${topic}\n\n



![Prevention](${preventionImage})



`
      );
    }

    return NextResponse.json({
      content,
      title: seoTitle,
      excerpt,
      metaDescription,
      tags,
      heroImage,
      seo
    });

  } catch (error) {
    console.error('Generate route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
