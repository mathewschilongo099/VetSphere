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

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');

  if (!topic) {
    return NextResponse.json({ error: 'Topic required' }, { status: 400 });
  }

  try {
    // =========================
    // SAFE GEMINI INITIALIZATION (FIXED)
    // =========================
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
You are an expert veterinary SEO content writer.

Write a 1500+ word SEO-optimized blog about: "${topic}"

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
- Make it highly detailed and educational
- Include at least 5 FAQs at the end
- No citations
- No references section
- No markdown titles outside the structure
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    // =========================
    // CLEAN TEXT
    // =========================
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

    // =========================
    // SEO DATA
    // =========================
    const plainText = content.replace(/[#*![\]()]/g, '').trim();

    const introMatch = plainText.match(/Introduction\s*([\s\S]+)/i);
    const introText = (introMatch ? introMatch[1] : plainText).trim();

    const buildExcerpt = (text: string, maxLength: number): string => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean.length <= maxLength) return clean;
      const truncated = text.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const excerpt =
      buildExcerpt(introText, 155) ||
      `Learn everything about ${topic} including causes, symptoms, treatment and prevention.`;

    const seoTitle = `${
      topic.charAt(0).toUpperCase() + topic.slice(1)
    }: Causes, Symptoms, Treatment and Prevention`;

    const metaDescription =
      buildExcerpt(introText, 160) ||
      `Expert veterinary guide on ${topic}. Learn causes, symptoms, diagnosis, treatment and prevention.`;

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
    const causesImage = await getUnsplashImage(topic + ' disease causes');
    const symptomsImage = await getUnsplashImage('sick animal ' + topic);
    const treatmentImage = await getUnsplashImage('veterinarian treatment animal');
    const preventionImage = await getUnsplashImage('farm animal prevention biosecurity');

    // =========================
    // IMAGE INJECTION
    // =========================
    if (heroImage) {
      content = content.replace(
        '## Introduction',
        `## Introduction\n\n![${topic}](${heroImage})`
      );
    }

    if (causesImage) {
      content = content.replace(
        `## Causes of ${topic}`,
        `## Causes of ${topic}\n\n![Causes](${causesImage})`
      );
    }

    if (symptomsImage) {
      content = content.replace(
        `## Clinical Signs and Symptoms of ${topic}`,
        `## Clinical Signs and Symptoms of ${topic}\n\n![Symptoms](${symptomsImage})`
      );
    }

    if (treatmentImage) {
      content = content.replace(
        `## Treatment of ${topic}`,
        `## Treatment of ${topic}\n\n![Treatment](${treatmentImage})`
      );
    }

    if (preventionImage) {
      content = content.replace(
        `## Prevention and Control of ${topic}`,
        `## Prevention and Control of ${topic}\n\n![Prevention](${preventionImage})`
      );
    }

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      content,
      title: seoTitle,
      excerpt,
      metaDescription,
      tags,
      heroImage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
