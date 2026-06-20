import { NextResponse } from 'next/server';

const VETERINARY_KEYWORDS = [
  'cattle', 'cow', 'dairy', 'livestock', 'poultry', 'chicken', 'goat',
  'sheep', 'pig', 'swine', 'dog', 'cat', 'pet', 'animal', 'veterinary',
  'vet', 'farm', 'disease', 'infection', 'parasite', 'vaccine', 'feeding',
  'nutrition', 'breeding', 'health', 'treatment', 'prevention'
];

async function getTrendingVetTopic(): Promise<string> {
  try {
    const res = await fetch(
      'https://trends.google.com/trending/rss?geo=ZW&hl=en',
      { next: { revalidate: 0 } }
    );
    const xml = await res.text();

    const titles = Array.from(xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g))
      .map(m => m[1])
      .filter(t => t !== 'Google Trends');

    const vetTrend = titles.find(title =>
      VETERINARY_KEYWORDS.some(keyword =>
        title.toLowerCase().includes(keyword)
      )
    );

    if (vetTrend) return vetTrend;

    const fallbackTopics = [
      'Mastitis in Dairy Cows',
      'Newcastle Disease in Poultry',
      'Tick Fever in Cattle',
      'Foot Rot in Goats',
      'Rabies Prevention in Dogs',
      'Worm Infestation in Cattle',
      'Brucellosis in Livestock',
      'African Swine Fever',
      'Avian Influenza in Poultry',
      'East Coast Fever in Cattle',
      'Blackleg Disease in Cattle',
      'Lumpy Skin Disease in Cattle',
      'Parvovirus in Dogs',
      'Feline Panleukopenia in Cats',
      'Contagious Caprine Pleuropneumonia in Goats',
      'Bovine Respiratory Disease',
      'Coccidiosis in Poultry',
      'Heartworm Disease in Dogs',
      'Ringworm in Cattle',
      'Pneumonia in Calves',
      'Anthrax in Livestock',
      'Bloat in Cattle',
      'Foot and Mouth Disease in Cattle',
      'Tetanus in Goats',
      'Salmonellosis in Poultry',
      'Canine Distemper',
      'Feline Leukemia Virus',
      'Mange in Dogs',
      'Trypanosomiasis in Cattle',
      'Peste des Petits Ruminants in Goats',
      'Fowl Pox in Chickens',
      'Liver Fluke in Cattle',
      'Pink Eye in Cattle',
      'Milk Fever in Dairy Cows',
      'Bovine Tuberculosis',
      'Kennel Cough in Dogs',
      'Toxoplasmosis in Cats',
      'Johne\'s Disease in Cattle',
      'Anaplasmosis in Cattle',
      'Goat Pox',
      'Infectious Bursal Disease in Poultry',
    ];

    const existingSlugs = await getExistingSlugs();
    const unusedTopics = fallbackTopics.filter(
      t => !existingSlugs.some(slug => slug.startsWith(topicToSlug(t)))
    );

    const pool = unusedTopics.length > 0 ? unusedTopics : fallbackTopics;
    return pool[Math.floor(Math.random() * pool.length)];
  } catch {
    return 'Lumpy Skin Disease in Cattle';
  }
}

async function getExistingSlugs(): Promise<string[]> {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return [];
    const files = await res.json();
    if (!Array.isArray(files)) return [];
    return files
      .map((f: { name: string }) => f.name.replace(/\.md$/, ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function topicToSlug(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex]?.urls?.regular || '';
  } catch {
    return '';
  }
}

export async function GET() {
  try {
    const topic = await getTrendingVetTopic();
    console.log('Auto-publishing topic:', topic);

    const existingSlugs = await getExistingSlugs();
    const topicSlugPrefix = topicToSlug(topic);
    const alreadyPublished = existingSlugs.some(slug => slug.startsWith(topicSlugPrefix));

    if (alreadyPublished) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: `Topic "${topic}" already has a published article. Skipping to avoid duplicate.`,
      });
    }

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
- Minimum 1500 words
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
- Include at least 5 frequently asked questions
- Format each as: ### Q: [question]\n**A:** [answer]

WRITING REQUIREMENTS:
- Write in clear simple English for farmers, students and pet owners
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

    content = content.replace(/\[\[\d+(?:,\s*\d+)*\]\]/g, '');
    content = content.replace(/\[\d+(?:,\s*\d+)*\]/g, '');

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
    const seoTitle = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Causes, Symptoms, Treatment and Prevention`;
    const metaDescription = buildExcerpt(introText, 160) || `Learn everything about ${topic} — causes, symptoms, diagnosis, treatment and prevention. Expert veterinary guide for farmers and pet owners.`;
    const tags = [
      topic.toLowerCase(),
      ...topic.toLowerCase().split(' ').filter((w: string) => w.length > 3),
      'animal health',
      'veterinary',
    ].slice(0, 6);

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

    const slug = seoTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const date = new Date().toISOString().split('T')[0];

    const markdown = `---
title: "${seoTitle}"
description: "${metaDescription.replace(/"/g, '\\"')}"
date: "${date}"
author: "VetSphere"
category: "Animal Health"
tags: [${tags.map((t: string) => `"${t}"`).join(', ')}]
image: "${heroImage || '/images/articles/cattle-diseases.jpg'}"
imageAlt: "${seoTitle}"
featured: false
---

# ${seoTitle}

${content}
`;

    const path = `src/content/articles/${slug}.md`;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Auto-publish: ${seoTitle}`,
          content: Buffer.from(markdown).toString('base64'),
        }),
      }
    );

    if (!githubRes.ok) {
      const err = await githubRes.json();
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, topic, title: seoTitle });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Auto-publish failed' }, { status: 500 });
  }
}
