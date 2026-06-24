import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// =========================
// FALLBACK IMAGES
// =========================
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
  // Try Pexels first
  const pexelsResult = await getPexelsImage(query);
  if (pexelsResult && !pexelsResult.includes('fallback')) {
    return pexelsResult;
  }
  
  // Fallback to Unsplash
  const unsplashResult = await getUnsplashImage(query);
  if (unsplashResult && !unsplashResult.includes('fallback')) {
    return unsplashResult;
  }
  
  // Final fallback
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

function buildExcerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

// =========================
// CLEAN CONTENT - Remove FAQ section
// =========================
function cleanContent(content: string): string {
  // Remove any FAQ section
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

// =========================
// INSERT IMAGES AFTER HEADINGS
// =========================
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

    // Fetch the URL content
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

    // Extract the article title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1].trim() : topic || 'Article';

    // Extract text content (remove HTML tags)
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

    // =========================
    // GENERATE CONTENT WITH GEMINI
    // =========================
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert veterinary SEO writer and affiliate marketer. Based on the following source content, create a NEW, ORIGINAL, and COMPLETELY REWRITTEN blog post.

Source Title: ${extractedTitle}
Source Content:
${textContent}

Create a new article with this structure:
## Introduction (as a paragraph, not a heading)
## Causes
## Clinical Signs and Symptoms
## How to Diagnose
## Treatment
## Prevention and Control
## When to Call a Veterinarian
## Conclusion

STYLE RULES:
- Write like a helpful blog post, not a textbook
- Use "you" and "your" to speak directly to the reader
- Include practical tips and advice
- Suggest products or solutions where relevant
- End each section with a takeaway tip
- Keep paragraphs short (2-3 sentences)
- Make it 1500+ words
- Use simple English for farmers and students
- DO NOT copy sentences directly from the source
- Rewrite everything in your own words
- Add new insights and examples where possible
- Make it SEARCH ENGINE OPTIMIZED
- Use relevant keywords naturally
- No citations
- No references section
- NO images or image descriptions
- NO markdown formatting except headings
- IMPORTANT: Do NOT include a "Frequently Asked Questions" section in the article content. SKIP IT COMPLETELY.
- Write only the article content with the specified headings

Return ONLY the article content in plain text format.
`;

    const result = await model.generateContent(prompt);
    let content = result.response.text();

    if (!content || content.trim().length < 200) {
      return NextResponse.json(
        { error: 'Generated content is too short. Please try again.' },
        { status: 500 }
      );
    }

    // Clean the content
    content = cleanContent(content)
      .replace(/```markdown/g, '')
      .replace(/```/g, '')
      .trim();

    // Generate meta description
    const plainText = content.replace(/[#*![\]()]/g, '').trim();
    const metaDescription = buildExcerpt(plainText, 160);

    // =========================
    // GENERATE IMAGES
    // =========================
    const heroImage = await getArticleImage(extractedTitle);
    const causesImage = await getArticleImage(`${extractedTitle} cause`);
    const symptomsImage = await getArticleImage(`${extractedTitle} symptoms`);
    const treatmentImage = await getArticleImage(`${extractedTitle} treatment`);
    const preventionImage = await getArticleImage(`${extractedTitle} prevention`);

    // Insert images after headings
    content = insertAfterHeading(content, /^##\s*Causes? of .*$/im, causesImage, `Causes of ${extractedTitle}`);
    content = insertAfterHeading(content, /^##\s*Clinical Signs? and Symptoms? of .*$/im, symptomsImage, `Symptoms of ${extractedTitle}`);
    content = insertAfterHeading(content, /^##\s*Treatment of .*$/im, treatmentImage, `Treatment of ${extractedTitle}`);
    content = insertAfterHeading(content, /^##\s*Prevention and? Control? of .*$/im, preventionImage, `Prevention of ${extractedTitle}`);

    // =========================
    // GENERATE SEO TITLE
    // =========================
    const seoTitle = extractedTitle + ': Causes, Symptoms, Treatment and Prevention';

    return NextResponse.json({
      success: true,
      title: seoTitle,
      content: content,
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
