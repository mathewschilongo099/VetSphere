import { NextRequest, NextResponse } from 'next/server';

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
    const [researchRes, heroImage, causesImage, symptomsImage, treatmentImage, preventionImage] =
      await Promise.all([
        fetch('https://api.you.com/v1/research', {
          method: 'POST',
          headers: {
            'X-API-Key': process.env.YOU_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: `You are an expert veterinary content writer and SEO specialist. Write a fully SEO-optimized, long-form veterinary article about: "${topic}".

SEO REQUIREMENTS:
- Target the main keyword: "${topic}" and use it naturally throughout
- Also use related long-tail keywords like "how to treat ${topic}", "symptoms of ${topic}", "prevention of ${topic}", "causes of ${topic}"
- Minimum 1500 words — longer articles rank better on Google
- The first paragraph must mention the main keyword within the first 100 words
- Use keyword-rich subheadings (H2 and H3)

STRUCTURE — use these EXACT headings:
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

FAQ SECTION REQUIREMENTS:
- Include at least 5 frequently asked questions farmers or pet owners would search on Google
- Format each as: ### Q: [question]\n**A:** [answer]
- Use natural question phrasing like "How do I...", "What are the signs of...", "Can humans get..."

WRITING REQUIREMENTS:
- Write in clear, simple English for farmers, students and pet owners
- Do NOT include citation numbers like [[1]] or [[2]] anywhere
- Do NOT include a references section
- Make each section at least 2-3 paragraphs
- Sound professional like a veterinary textbook
- Start directly with ## Introduction`,
            research_effort: 'standard',
          }),
        }),
        getUnsplashImage(topic + ' livestock farm'),
        getUnsplashImage(topic + ' animal disease'),
        getUnsplashImage('sick ' + topic + ' animal'),
        getUnsplashImage('veterinarian farmer treatment'),
        getUnsplashImage('farm biosecurity prevention animal'),
      ]);

    const data = await researchRes.json();
    let content = data.output?.content || '';

    // Remove citation numbers
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

    // Generate SEO excerpt BEFORE injecting images
    const plainText = content.replace(/[#*![\]()]/g, '').trim();
    const introMatch = plainText.match(/Introduction\s*([\s\S]+)/i);
    const introText = (introMatch ? introMatch[1] : plainText).trim();

    const buildExcerpt = (text: string, maxLength: number): string => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (clean.length <= maxLength) return clean;
      const truncated = clean.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
    };

    const excerpt = buildExcerpt(introText, 155);

    // Generate SEO title
    const seoTitle = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Causes, Symptoms, Treatment and Prevention`;

    // Generate SEO meta description
    const metaDescription = buildExcerpt(introText, 160) || `Learn everything about ${topic} — causes, symptoms, diagnosis, treatment and prevention. Expert veterinary guide for farmers and pet owners.`;

    // Generate tags from topic
    const tags = [
      topic.toLowerCase(),
      ...topic.toLowerCase().split(' ').filter((w: string) => w.length > 3),
      'animal health',
      'veterinary',
      'livestock',
    ].slice(0, 6);

    // Inject images after each section heading
    if (heroImage) {
      content = content.replace(
        '## Introduction',
        `## Introduction\n\n

![${topic}](${heroImage})

\n*Photo: ${topic} — via Unsplash*\n`
      );
    }
    if (causesImage) {
      content = content.replace(
        `## Causes of ${topic}`,
        `## Causes of ${topic}\n\n

![Causes of ${topic}](${causesImage})

\n*Photo: Causes — via Unsplash*\n`
      );
    }
    if (symptomsImage) {
      content = content.replace(
        `## Clinical Signs and Symptoms of ${topic}`,
        `## Clinical Signs and Symptoms of ${topic}\n\n

![Symptoms of ${topic}](${symptomsImage})

\n*Photo: Clinical Signs — via Unsplash*\n`
      );
    }
    if (treatmentImage) {
      content = content.replace(
        `## Treatment of ${topic}`,
        `## Treatment of ${topic}\n\n

![Treatment for ${topic}](${treatmentImage})

\n*Photo: Treatment — via Unsplash*\n`
      );
    }
    if (preventionImage) {
      content = content.replace(
        `## Prevention and Control of ${topic}`,
        `## Prevention and Control of ${topic}\n\n

![Prevention of ${topic}](${preventionImage})

\n*Photo: Prevention — via Unsplash*\n`
      );
    }

    return NextResponse.json({
      content,
      title: seoTitle,
      excerpt,
      metaDescription,
      tags,
      heroImage,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
