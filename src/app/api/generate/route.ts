import { NextRequest, NextResponse } from 'next/server';

async function getUnsplashImage(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || '';
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
    // Fetch article and images in parallel
    const [researchRes, heroImage, causesImage, symptomsImage, treatmentImage, preventionImage] =
      await Promise.all([
        fetch('https://api.you.com/v1/research', {
          method: 'POST',
          headers: {
            'X-API-Key': process.env.YOU_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: `Write a long, detailed, professional veterinary article about: ${topic}.

Requirements:
- Minimum 800 words
- Use these exact section headings: ## Introduction, ## Causes, ## Clinical Signs and Symptoms, ## Diagnosis, ## Treatment, ## Prevention and Control, ## When to Call a Veterinarian, ## Conclusion
- Write in clear simple English for farmers, students and pet owners
- Do NOT include citation numbers like [[1]] or [[2]] anywhere
- Do NOT include a references section
- Make each section at least 2-3 paragraphs long
- Sound professional like a veterinary textbook
- Start directly with ## Introduction, no preamble`,
            research_effort: 'standard',
          }),
        }),
        getUnsplashImage(topic + ' animal'),
        getUnsplashImage(topic + ' animal disease cause'),
        getUnsplashImage(topic + ' sick animal symptoms'),
        getUnsplashImage(topic + ' veterinary treatment'),
        getUnsplashImage(topic + ' animal farm prevention'),
      ]);

    const data = await researchRes.json();
    let content = data.output?.content || '';

    // Remove citation numbers
    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

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
        '## Causes',
        `## Causes\n\n

![Causes of ${topic}](${causesImage})

\n*Photo: Causes — via Unsplash*\n`
      );
    }
    if (symptomsImage) {
      content = content.replace(
        '## Clinical Signs and Symptoms',
        `## Clinical Signs and Symptoms\n\n

![Symptoms of ${topic}](${symptomsImage})

\n*Photo: Clinical Signs — via Unsplash*\n`
      );
    }
    if (treatmentImage) {
      content = content.replace(
        '## Treatment',
        `## Treatment\n\n

![Treatment for ${topic}](${treatmentImage})

\n*Photo: Treatment — via Unsplash*\n`
      );
    }
    if (preventionImage) {
      content = content.replace(
        '## Prevention and Control',
        `## Prevention and Control\n\n

![Prevention of ${topic}](${preventionImage})

\n*Photo: Prevention — via Unsplash*\n`
      );
    }

    const title = topic.charAt(0).toUpperCase() + topic.slice(1);
    const plainText = content.replace(/[#*![\]()]/g, '').trim();
    const excerpt = plainText.substring(0, 150) + '...';

    return NextResponse.json({
      content,
      title,
      excerpt,
      heroImage,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
