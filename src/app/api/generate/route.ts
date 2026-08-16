export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/18351958/pexels-photo-18351958/free-photo-of-a-cow-standing-in-a-field-next-to-a-tree.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351948/pexels-photo-18351948/free-photo-of-a-group-of-chickens-in-a-pen.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351947/pexels-photo-18351947/free-photo-of-a-goat-standing-in-a-field.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351941/pexels-photo-18351941/free-photo-of-a-veterinarian-examining-a-dog.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351938/pexels-photo-18351938/free-photo-of-a-veterinarian-holding-a-cat.jpeg?w=800&h=400&fit=crop',
];

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
    if (!res.ok) {
      return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    }
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) {
      return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    }
    const randomIndex = Math.floor(Math.random() * Math.min(results.length, 5));
    return results[randomIndex]?.urls?.regular || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  } catch {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
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
    if (!res.ok) {
      return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    }
    const data = await res.json();
    const results = data.photos || [];
    if (results.length === 0) {
      return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    }
    const randomIndex = Math.floor(Math.random() * Math.min(results.length, 5));
    return results[randomIndex]?.src?.large || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  } catch {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  }
}

async function getArticleImage(query: string): Promise<string> {
  const pexelsResult = await getPexelsImage(query);
  if (pexelsResult && !pexelsResult.includes('fallback')) {
    return pexelsResult;
  }
  const unsplashResult = await getUnsplashImage(query);
  if (unsplashResult && !unsplashResult.includes('fallback')) {
    return unsplashResult;
  }
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
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
      input: `You are an expert veterinary SEO writer and content creator. Write a 1500+ word SEO blog about: "${topic}"

IMPORTANT: Choose the BEST writing style for this topic:
- For news/breaking topics: Write like a news article
- For educational topics: Write like a helpful guide
- For how-to topics: Write a step-by-step guide
- For general topics: Write an engaging blog post

DO NOT use the rigid "Causes, Symptoms, Treatment, Prevention" structure unless it genuinely fits the topic.

STRUCTURE GUIDELINES:
- Start with a compelling introduction
- Use clear headings that make sense for the topic
- Include practical, actionable information
- Use bullet points and lists where helpful
- End with a strong conclusion

STYLE RULES:
- Write like a helpful expert, not a textbook
- Use "you" and "your" to speak directly to readers
- Keep paragraphs short (2-3 sentences)
- Use simple, clear English
- Include relevant keywords naturally
- Include at least 5 FAQs
- No citations
- No references section
- No images or image descriptions
- No horizontal lines (---)`,
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

function buildFallbackTags(topic: string): string[] {
  const cleaned = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter((w) => w.length > 3 && !['your', 'this', 'that', 'might', 'could', 'should'].includes(w));

  return Array.from(new Set([topic.toLowerCase(), ...cleaned, 'animal health', 'veterinary'])).slice(0, 6);
}

function cleanContent(content: string): string {
  content = content.replace(/^# .+?\n/, '');
  content = content.replace(
    /##\s*Frequently Asked Questions About.*?([\s\S]*?)(?=##|$)/gi,
    ''
  );
  content = content.replace(
    /##\s*Frequently Asked Questions.*$/i,
    ''
  );
  content = content.replace(
    /\d+\.\s*\*\*.*?\?\*\*[\s\S]*?(?=\d+\.\s*\*\*|##|$)/g,
    ''
  );
  content = content.replace(
    /^\s*Frequently Asked Questions\s*$/gim,
    ''
  );
  content = content.replace(
    /!\[[^\]]*\]\([^)]*\)\s*\n*/g,
    ''
  );
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();
  return content;
}

const insertAfterHeading = (
  text: string,
  headingPattern: RegExp,
  imageUrl: string,
  altText: string
): string => {
  if (!imageUrl) return text;
  const match = text.match(headingPattern);
  if (!match) return text;
  const heading = match[0];
  return text.replace(heading, `${heading}\n\n<img src="${imageUrl}" alt="${altText}" loading="lazy" />\n`);
};

// Cleans a raw title string returned by the model: strips quotes, markdown
// bold/heading markers, trailing punctuation noise, and enforces a sane
// max length so it stays SEO-friendly.
function sanitizeTitle(raw: string, topic: string): string | null {
  if (!raw) return null;

  let title = raw
    .split('\n')[0] // just in case the model added extra lines
    .replace(/^#+\s*/, '') // leading markdown heading hashes
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '') // wrapping quotes
    .replace(/\*\*/g, '') // bold markers
    .replace(/^Title:\s*/i, '') // stray "Title:" prefix
    .trim();

  if (title.length < 5) return null;
  if (title.length > 120) {
    title = title.slice(0, 117).trim() + '...';
  }

  return title;
}

function fallbackTitle(topic: string): string {
  return topic
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') + ': Causes, Symptoms, Treatment & Prevention';
}

// Generates a title that matches the style/structure of the article that
// was actually produced, rather than forcing every topic into the same
// "Causes, Symptoms, Treatment & Prevention" template.
async function generateTitle(
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>,
  topic: string,
  articleContent: string
): Promise<string> {
  const contentPreview = articleContent.slice(0, 600);

  const titlePrompt = `
You are an expert SEO editor for a veterinary/animal-health website.

Below is the topic and the opening of an article that was already written about it.
Write ONE compelling, SEO-friendly title for this specific article.

RULES:
- The title must match the actual style and structure of the article content below
  (e.g. if it's a how-to/guide, the title should read like a guide; if it's a news piece,
  the title should read like a headline; if it genuinely is about a disease/condition
  with causes/symptoms/treatment, that structure is fine)
- Do NOT default to "Causes, Symptoms, Treatment & Prevention" unless the article content
  genuinely covers all of those things as its main structure
- Keep it under 70 characters if possible, no more than 100
- No quotation marks, no markdown, no trailing punctuation like colons dangling at the end
- Return ONLY the title text, nothing else

Topic: "${topic}"

Article opening:
"""
${contentPreview}
"""
`.trim();

  const result = await model.generateContent(titlePrompt);
  const response = await result.response;
  const rawTitle = response.text();

  const cleaned = sanitizeTitle(rawTitle, topic);
  if (!cleaned) {
    throw new Error('Title generation returned unusable output');
  }
  return cleaned;
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
      model: 'gemini-2.5-flash',
    });

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
        search_intent: 'informational',
        questions: [],
      };
    }

    const prompt = `
You are an expert veterinary SEO writer and content creator.

PRIMARY KEYWORD: ${seo.primary_keyword}
SECONDARY KEYWORDS: ${seo.secondary_keywords.join(', ')}
LONG TAIL KEYWORDS: ${seo.long_tail_keywords.join(', ')}
SEARCH INTENT: ${seo.search_intent}

Write a 1500+ word SEO blog about: "${topic}"

IMPORTANT: Choose the BEST writing style for this topic:
- For news/breaking topics: Write like a news article with a headline, introduction, key facts, and analysis
- For educational topics: Write like a helpful guide with clear sections
- For how-to topics: Write a step-by-step guide
- For general topics: Write an engaging blog post that informs and helps readers

DO NOT use the rigid "Causes, Symptoms, Treatment, Prevention" structure unless it genuinely fits the topic.

STRUCTURE GUIDELINES:
- Start with a compelling introduction that hooks the reader
- Use clear headings (## and ###) that make sense for the topic
- Include practical, actionable information
- Use bullet points and lists where helpful
- End with a strong conclusion

STYLE RULES:
- Write like a helpful expert, not a textbook
- Use "you" and "your" to speak directly to readers
- Keep paragraphs short (2-3 sentences)
- Use simple, clear English
- Include relevant keywords naturally
- Include at least 5 FAQs at the end
- No citations
- No references section
- No images or image descriptions
- No horizontal lines (---)

Write only the article content with appropriate headings.`;

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

    content = cleanContent(content);
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

    const plainText = content.replace(/[#*![\]()]/g, '').trim();

    const buildExcerpt = (text: string, maxLength: number): string => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean.length <= maxLength) return clean;
      const truncated = text.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const excerpt = buildExcerpt(plainText, 155);

    // Let Gemini choose the title based on the actual article content and
    // style, instead of always forcing the disease-template title. Falls
    // back to the old hardcoded format only if this step fails.
    let seoTitle: string;
    try {
      seoTitle = await generateTitle(model, topic, content);
    } catch (titleError) {
      console.error('Title generation failed, using fallback title:', titleError);
      seoTitle = fallbackTitle(topic);
    }

    const metaDescription = buildExcerpt(plainText, 160);
    const tags = buildFallbackTags(topic);

    const heroImage = await getArticleImage(`${topic} livestock farm`);
    const causesImage = await getArticleImage(`${topic} cause infection`);
    const symptomsImage = await getArticleImage(`${topic} symptoms sick animal`);
    const treatmentImage = await getArticleImage(`${topic} veterinarian treatment`);
    const preventionImage = await getArticleImage(`${topic} prevention vaccine biosecurity`);

    content = insertAfterHeading(content, /^##\s*Causes? of .*$/im, causesImage, `Causes of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Clinical Signs? and Symptoms? of .*$/im, symptomsImage, `Symptoms of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Treatment of .*$/im, treatmentImage, `Treatment of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Prevention and? Control? of .*$/im, preventionImage, `Prevention of ${topic}`);

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
