import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
  'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
  'https://images.unsplash.com/photo-1594144849889-44d9d9443057?w=800',
];

async function getArticleImage(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
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
    
    return results[0]?.urls?.regular || FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  } catch {
    return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
  }
}

function buildExcerpt(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

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
    const extractedTitle = titleMatch ? titleMatch[1].trim() : topic || 'Veterinary Article';

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
You are an expert veterinary SEO writer and affiliate marketer. Based on the following source content, create a NEW, ORIGINAL, and COMPLETELY REWRITTEN veterinary blog post.

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
## Frequently Asked Questions
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

    const cleanContent = content
      .replace(/```markdown/g, '')
      .replace(/```/g, '')
      .trim();

    // Generate meta description from the content
    const plainText = cleanContent.replace(/[#*![\]()]/g, '').trim();
    const metaDescription = buildExcerpt(plainText, 160);

    const heroImage = await getArticleImage(`${extractedTitle} veterinary`);

    return NextResponse.json({
      success: true,
      title: extractedTitle,
      content: cleanContent,
      metaDescription: metaDescription,
      sourceUrl: url,
      sourceTitle: extractedTitle,
      heroImage: heroImage,
    });

  } catch (error) {
    console.error('Error rewriting from URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process URL' },
      { status: 500 }
    );
  }
}
