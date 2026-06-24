import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/18351958/pexels-photo-18351958/free-photo-of-a-cow-standing-in-a-field-next-to-a-tree.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351948/pexels-photo-18351948/free-photo-of-a-group-of-chickens-in-a-pen.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351947/pexels-photo-18351947/free-photo-of-a-goat-standing-in-a-field.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351941/pexels-photo-18351941/free-photo-of-a-veterinarian-examining-a-dog.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351938/pexels-photo-18351938/free-photo-of-a-veterinarian-holding-a-cat.jpeg?w=800&h=400&fit=crop',
];

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

async function getArticleImage(query: string): Promise<string> {
  const cleanQuery = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const searchQueries = [
    cleanQuery,
    `${cleanQuery} animal`,
    `${cleanQuery} livestock`,
    'farm animal',
    'veterinary care'
  ];

  for (const searchQuery of searchQueries.slice(0, 3)) {
    const pexelsResult = await getPexelsImage(searchQuery);
    if (pexelsResult && !pexelsResult.includes('fallback')) {
      return pexelsResult;
    }
  }

  for (const searchQuery of searchQueries.slice(0, 3)) {
    const unsplashResult = await getUnsplashImage(searchQuery);
    if (unsplashResult && !unsplashResult.includes('fallback')) {
      return unsplashResult;
    }
  }

  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

function buildExcerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
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

export async function POST(request: NextRequest) {
  try {
    const { url, topic } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

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

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : topic || 'Article';

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert veterinary SEO writer and content creator. Based on the following source content, create a NEW, ORIGINAL, and COMPLETELY REWRITTEN blog post.

Source Title: ${extractedTitle}
Source Content:
${textContent}

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
- DO NOT copy sentences directly from the source
- Rewrite everything in your own words

Return ONLY the article content in plain text format.`;

    let content = await model.generateContent(prompt);
    let result = content.response.text();

    if (!result || result.trim().length < 200) {
      return NextResponse.json(
        { error: 'Generated content is too short. Please try again.' },
        { status: 500 }
      );
    }

    result = cleanContent(result)
      .replace(/```markdown/g, '')
      .replace(/```/g, '')
      .trim();

    const plainText = result.replace(/[#*![\]()]/g, '').trim();
    const metaDescription = buildExcerpt(plainText, 160);
    const seoTitle = extractedTitle + ': Causes, Symptoms, Treatment and Prevention';

    const heroImage = await getArticleImage(extractedTitle);
    const causesImage = await getArticleImage(`${extractedTitle} cause`);
    const symptomsImage = await getArticleImage(`${extractedTitle} symptoms`);
    const treatmentImage = await getArticleImage(`${extractedTitle} treatment`);
    const preventionImage = await getArticleImage(`${extractedTitle} prevention`);

    result = insertAfterHeading(result, /^##\s*Causes? of .*$/im, causesImage, `Causes of ${extractedTitle}`);
    result = insertAfterHeading(result, /^##\s*Clinical Signs? and Symptoms? of .*$/im, symptomsImage, `Symptoms of ${extractedTitle}`);
    result = insertAfterHeading(result, /^##\s*Treatment of .*$/im, treatmentImage, `Treatment of ${extractedTitle}`);
    result = insertAfterHeading(result, /^##\s*Prevention and? Control? of .*$/im, preventionImage, `Prevention of ${extractedTitle}`);

    return NextResponse.json({
      success: true,
      title: seoTitle,
      content: result,
      metaDescription: metaDescription,
      heroImage: heroImage,
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
