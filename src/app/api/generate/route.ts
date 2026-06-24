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

async function getPexelsImage(query: string): Promise<string> {
  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&page=${randomPage}&orientation=landscape`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY || '',
        },
      }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const results = data.photos || [];
    if (results.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex]?.src?.large || '';
  } catch {
    return '';
  }
}

async function getArticleImage(query: string): Promise<string> {
  const pexelsResult = await getPexelsImage(query);
  if (pexelsResult) return pexelsResult;
  console.error(`Pexels returned no image for "${query}", falling back to Unsplash`);
  return getUnsplashImage(query);
}

function extractJson(text: string): string {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
}

async function generateWithYouCom(topic: string): Promise<string> {
  const res = await fetch('https://api.you.com/v1/research', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.YOU_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: `You are an expert veterinary SEO writer. Write a 1500+ word SEO blog about: "${topic}"

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
- Naturally include keywords related to "${topic}"
- Include at least 5 FAQs
- No citations
- No references section
- Start directly with ## Introduction`,
      research_effort: 'standard',
    }),
  });

  if (!res.ok) {
    throw new Error(`you.com fallback request failed with status ${res.status}`);
  }

  const data = await res.json();
  const content = data.output?.content || '';

  if (!content || content.trim().length < 200) {
    throw new Error('you.com fallback returned empty or too-short content');
  }

  return content;
}

// Fallback only used if Gemini's SEO step fails to return usable tags —
// produces something better than raw word-splitting, though real topical
// tags from Gemini are always preferred when available.
function buildFallbackTags(topic: string): string[] {
  const cleaned = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter((w) => w.length > 3 && !['your', 'this', 'that', 'might', 'could', 'should'].includes(w));

  return [...new Set([topic.toLowerCase(), ...cleaned, 'animal health', 'veterinary'])].slice(0, 6);
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
    // Now also generates real topical tags, instead of relying on
    // mechanically splitting the topic string into word fragments
    // (which produced junk tags like "#your", "#might", "#stomach").
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
  ],
  "tags": ["short topical tag 1", "short topical tag 2", "short topical tag 3", "short topical tag 4", "short topical tag 5"]
}

For "tags": provide 5 short (1-3 word) topical category tags that describe what this article is ABOUT — for example the affected animal, body system, or disease type. Do NOT just chop up the topic phrase into individual words. Good examples: "cat health", "gut microbiome", "digestive issues", "feline care", "pet nutrition". Bad examples (do not do this): "your", "might", "stomach", "is".
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
        search_intent: 'informational',
        questions: [],
        tags: [],
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
    let usedFallback = false;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      content = response.text();

      if (!content || content.trim().length < 200) {
        throw new Error('Gemini returned empty or too-short content');
      }
    } catch (genError) {
      console.error('Gemini generation failed, falling back to you.com:', genError);
      try {
        content = await generateWithYouCom(topic);
        usedFallback = true;
      } catch (fallbackError) {
        console.error('you.com fallback also failed:', fallbackError);
        throw new Error(
          `Both Gemini and you.com fallback failed. Gemini: ${genError instanceof Error ? genError.message : 'unknown'}. you.com: ${fallbackError instanceof Error ? fallbackError.message : 'unknown'}`
        );
      }
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

    // Use Gemini's real topical tags if it returned usable ones, otherwise
    // fall back to a cleaner word-filter (still better than the old logic).
    const geminiTags = Array.isArray(seo.tags) ? seo.tags.filter((t: unknown) => typeof t === 'string' && t.trim().length > 0) : [];
    const tags = geminiTags.length >= 3
      ? geminiTags.slice(0, 6)
      : buildFallbackTags(topic);

    // =========================
    // IMAGES
    // Hero image is shown in the page template above the article body,
    // so we do NOT inject it into ## Introduction to avoid duplication.
    // Only inject images for Causes, Symptoms, Treatment and Prevention.
    // =========================
    const heroImage = await getArticleImage(`${topic} livestock farm`);
    const causesImage = await getArticleImage(`${topic} cause infection`);
    const symptomsImage = await getArticleImage(`${topic} symptoms sick animal`);
    const treatmentImage = await getArticleImage(`${topic} veterinarian treatment`);
    const preventionImage = await getArticleImage(`${topic} prevention vaccine biosecurity`);

    const insertAfterHeading = (
      text: string,
      headingPattern: RegExp,
      imageUrl: string,
      altText: string
    ): string => {
      if (!imageUrl) return text;
      const match = text.match(headingPattern);
      if (!match) {
        console.error(`Heading pattern not found for "${altText}" image, skipping insertion`);
        return text;
      }
      const heading = match[0];
      return text.replace(heading, `${heading}\n\n

![${altText}](${imageUrl})

\n`);
    };

    // ✅ NO image injection at Introduction — hero image already shows above article
    content = insertAfterHeading(content, /^##\s*Causes of.*$/im, causesImage, `Causes of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Clinical Signs.*$/im, symptomsImage, `Symptoms of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Treatment of.*$/im, treatmentImage, `Treatment of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Prevention.*$/im, preventionImage, `Prevention of ${topic}`);

    return NextResponse.json({
      content,
      title: seoTitle,
      excerpt,
      metaDescription,
      tags,
      heroImage,
      seo,
      usedFallback,
    });

  } catch (error) {
    console.error('Generate route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
