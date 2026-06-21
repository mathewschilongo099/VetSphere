export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const VETERINARY_KEYWORDS = [
  'cattle', 'cow', 'dairy', 'livestock', 'poultry', 'chicken', 'goat',
  'sheep', 'pig', 'swine', 'dog', 'cat', 'pet', 'animal', 'veterinary',
  'vet', 'farm', 'disease', 'infection', 'parasite', 'vaccine', 'feeding',
  'nutrition', 'breeding', 'health', 'treatment', 'prevention'
];

// Google's Trends RSS feed has no true "worldwide" mode — it always requires
// a country geo code. To approximate a global/worldwide audience instead of
// one country, we sample trending topics across several major English-speaking
// regions and pool the results together.
const TRENDING_REGIONS = ['US', 'GB', 'IN', 'NG', 'ZA', 'AU', 'CA'];

async function getTrendingVetTopic(): Promise<string> {
  try {
    const allTitles: string[] = [];

    await Promise.all(
      TRENDING_REGIONS.map(async (geo) => {
        try {
          const res = await fetch(
            `https://trends.google.com/trending/rss?geo=${geo}&hl=en`,
            { next: { revalidate: 0 } }
          );
          const xml = await res.text();
          const titles = Array.from(xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g))
            .map(m => m[1])
            .filter(t => t !== 'Google Trends');
          allTitles.push(...titles);
        } catch {
          // Ignore failures from any single region; others may still succeed.
        }
      })
    );

    const vetTrend = allTitles.find(title =>
      VETERINARY_KEYWORDS.some(keyword =>
        title.toLowerCase().includes(keyword)
      )
    );

    if (vetTrend) return vetTrend;

    const fallbackTopics = [
      'Mastitis in Dairy Cows',
      'Tick Fever in Cattle',
      'East Coast Fever in Cattle',
      'Blackleg Disease in Cattle',
      'Lumpy Skin Disease in Cattle',
      'Bovine Respiratory Disease',
      'Ringworm in Cattle',
      'Pneumonia in Calves',
      'Anthrax in Livestock',
      'Bloat in Cattle',
      'Foot and Mouth Disease in Cattle',
      'Milk Fever in Dairy Cows',
      'Bovine Tuberculosis',
      'Anaplasmosis in Cattle',
      'Liver Fluke in Cattle',
      'Pink Eye in Cattle',
      'Trypanosomiasis in Cattle',
      'Worm Infestation in Cattle',
      'Brucellosis in Livestock',
      'Johne\'s Disease in Cattle',
      'Newcastle Disease in Poultry',
      'Avian Influenza in Poultry',
      'Coccidiosis in Poultry',
      'Infectious Bursal Disease in Poultry',
      'Fowl Pox in Chickens',
      'Salmonellosis in Poultry',
      'Marek\'s Disease in Chickens',
      'Fowl Cholera in Poultry',
      'Infectious Bronchitis in Chickens',
      'Mycoplasma Infection in Poultry',
      'Foot Rot in Goats',
      'Peste des Petits Ruminants in Goats',
      'Contagious Caprine Pleuropneumonia in Goats',
      'Tetanus in Goats',
      'Goat Pox',
      'Caseous Lymphadenitis in Goats',
      'Enterotoxemia in Goats',
      'Ovine Johne\'s Disease in Sheep',
      'Scrapie in Sheep',
      'Nairobi Sheep Disease',
      'African Swine Fever',
      'Porcine Reproductive and Respiratory Syndrome',
      'Swine Erysipelas',
      'Porcine Circovirus Disease',
      'Classical Swine Fever',
      'Rabies Prevention in Dogs',
      'Parvovirus in Dogs',
      'Canine Distemper',
      'Mange in Dogs',
      'Heartworm Disease in Dogs',
      'Kennel Cough in Dogs',
      'Tick Infestation in Dogs',
      'Canine Parvovirus Vaccination Guide',
      'How to Keep Your Dog Healthy',
      'Common Signs of Illness in Dogs',
      'Dog Nutrition and Feeding Guide',
      'Deworming Your Dog Safely',
      'Dental Care for Dogs',
      'Exercise and Weight Management in Dogs',
      'Puppy Care and Vaccination Schedule',
      'Feline Panleukopenia in Cats',
      'Feline Leukemia Virus',
      'Toxoplasmosis in Cats',
      'Cat Flu and Respiratory Infections',
      'Feline Immunodeficiency Virus',
      'How to Keep Your Cat Healthy',
      'Cat Vaccination Schedule for Pet Owners',
      'Nutrition and Feeding Guide for Cats',
      'Common Signs of Illness in Cats',
      'Indoor vs Outdoor Cat Health',
      'Mineral Nutrition for Dairy Cattle',
      'Protein Supplementation for Beef Cattle',
      'Feeding Dairy Cows for Maximum Milk Production',
      'Best Feeding Practices for Goats',
      'Vitamin Deficiencies in Livestock',
      'Calcium and Phosphorus Balance in Cattle',
      'Selenium Deficiency in Livestock',
      'How to Feed Calves for Healthy Growth',
      'Nutrition for Pregnant Cows',
      'Feeding Goats During Dry Season',
      'Poultry Feed Formulation for Farmers',
      'How to Supplement Minerals for Livestock',
      'Energy Requirements for Lactating Cows',
      'Feed Quality and Storage on the Farm',
      'Biosecurity Measures on Livestock Farms',
      'How to Set Up a Poultry House',
      'Record Keeping for Livestock Farmers',
      'When to Call a Veterinarian',
      'How to Handle and Restrain Cattle Safely',
      'Water Quality and Animal Health',
      'Vaccination Programs for Livestock Farmers',
      'Deworming Programs for Cattle and Goats',
      'Housing and Shelter for Livestock',
      'How to Manage a Small Dairy Farm',
      'Rotational Grazing for Cattle Health',
      'Pasture Management for Livestock Farmers',
      'Livestock Identification and Tagging',
      'Farm Sanitation and Disease Prevention',
      'How to Build a Healthy Poultry Flock',
      'Cattle Breeding and Reproduction Guide',
      'Signs of Heat in Dairy Cows',
      'Artificial Insemination in Cattle',
      'Pregnancy and Calving Management in Cows',
      'Common Reproductive Problems in Goats',
      'Improving Fertility in Livestock',
      'Dystocia and Difficult Births in Cattle',
      'Retained Placenta in Dairy Cows',
      'Reproductive Health in Pigs',
      'Goat Kidding Management for Farmers',
      'How to Do a Body Condition Score in Cattle',
      'Signs of Pain and Stress in Animals',
      'Animal Welfare on the Farm',
      'First Aid for Farm Animals',
      'How to Give Injections to Livestock',
      'Zoonotic Diseases Farmers Should Know',
      'Heat Stress in Livestock During Summer',
      'Cold Stress and Winter Care for Animals',
      'How to Spot a Sick Animal Early',
      'Importance of Clean Water for Animal Health',
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

// Free, global, no API key: Google's public autocomplete endpoint returns
// real search-phrase suggestions for a query. This gives genuine keyword
// signal (what people actually type) without any paid SEO API.
async function getAutocompleteKeywords(topic: string): Promise<string[]> {
  try {
    const prefixes = ['', 'how to ', 'best ', 'signs of ', 'treatment for '];
    const suggestionSets = await Promise.all(
      prefixes.map(async (prefix) => {
        try {
          const query = `${prefix}${topic}`;
          const res = await fetch(
            `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`,
            { next: { revalidate: 0 } }
          );
          const data = await res.json();
          // Response shape: [query, [suggestion1, suggestion2, ...]]
          return Array.isArray(data?.[1]) ? (data[1] as string[]) : [];
        } catch {
          return [];
        }
      })
    );

    const merged = suggestionSets.flat();
    // De-duplicate and cap to a reasonable number for the prompt
    const unique = Array.from(new Set(merged.map(s => s.trim()).filter(Boolean)));
    return unique.slice(0, 12);
  } catch {
    return [];
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

    const autocompleteKeywords = await getAutocompleteKeywords(topic);
    const keywordLine = autocompleteKeywords.length > 0
      ? `\n\nREAL SEARCH PHRASES PEOPLE USE (from Google Autocomplete) — weave these naturally into the article where relevant, especially in subheadings and the FAQ section:\n${autocompleteKeywords.map(k => `- ${k}`).join('\n')}`
      : '';

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
- Also use related long-tail keywords like "how to ${topic}", "tips for ${topic}", "guide to ${topic}"
- Minimum 1500 words
- The first paragraph must mention the main keyword within the first 100 words
- Use keyword-rich subheadings (H2 and H3)${keywordLine}

STRUCTURE — use these EXACT headings:
## Introduction
## What is ${topic}?
## Why ${topic} Matters for Farmers and Pet Owners
## Key Facts About ${topic}
## Practical Guide to ${topic}
## Common Mistakes to Avoid
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
        getUnsplashImage(topic + ' animal'),
        getUnsplashImage(topic + ' farmer'),
        getUnsplashImage('veterinarian farmer treatment'),
        getUnsplashImage('farm animal healthy'),
      ]);

    const data = await researchRes.json();
    let content = data.output?.content || '';

    if (!researchRes.ok || !content || content.trim().length < 200) {
      console.error('Research API returned no usable content:', researchRes.status, data);
      return NextResponse.json({
        success: false,
        error: 'Research API did not return usable article content. Skipping publish to avoid a blank article.',
      }, { status: 500 });
    }

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
    const seoTitle = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: A Complete Guide for Farmers and Pet Owners`;
    const metaDescription = buildExcerpt(introText, 160) || `Complete guide to ${topic} — expert veterinary advice for farmers and pet owners to keep their animals healthy.`;
    const tags = [
      topic.toLowerCase(),
      ...topic.toLowerCase().split(' ').filter((w: string) => w.length > 3),
      ...autocompleteKeywords.slice(0, 2).map(k => k.toLowerCase()),
      'animal health',
      'veterinary',
    ].slice(0, 8);

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
        `## What is ${topic}?`,
        `## What is ${topic}?\n\n

![${topic}](${causesImage})

\n*Photo: ${topic} — via Unsplash*\n`
      );
    }
    if (symptomsImage) {
      content = content.replace(
        `## Key Facts About ${topic}`,
        `## Key Facts About ${topic}\n\n

![${topic} facts](${symptomsImage})

\n*Photo: ${topic} — via Unsplash*\n`
      );
    }
    if (treatmentImage) {
      content = content.replace(
        `## Practical Guide to ${topic}`,
        `## Practical Guide to ${topic}\n\n

![${topic} guide](${treatmentImage})

\n*Photo: ${topic} — via Unsplash*\n`
      );
    }
    if (preventionImage) {
      content = content.replace(
        `## Common Mistakes to Avoid`,
        `## Common Mistakes to Avoid\n\n

![Common mistakes](${preventionImage})

\n*Photo: Farm management — via Unsplash*\n`
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
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // GitHub's Contents API requires the current file's sha to update it.
    // If this file already exists (e.g. a near-simultaneous run already published
    // this exact slug), PUT-ing without a sha returns a 422 conflict — which is
    // the "Error" deployments you were seeing in Vercel. Check first and skip
    // cleanly instead of erroring out.
    let existingSha: string | undefined;
    try {
      const existingRes = await fetch(contentsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (existingRes.ok) {
        const existingData = await existingRes.json();
        existingSha = existingData.sha;
      }
    } catch {
      // If this check itself fails, fall through and attempt a normal create.
    }

    if (existingSha) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: `File "${path}" already exists (likely published by a concurrent run). Skipping.`,
      });
    }

    const githubRes = await fetch(contentsUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Auto-publish: ${seoTitle}`,
        content: Buffer.from(markdown).toString('base64'),
      }),
    });

    if (!githubRes.ok) {
      const err = await githubRes.json().catch(() => ({ message: 'Unknown GitHub API error' }));
      console.error('Auto-publish GitHub PUT failed:', githubRes.status, err);
      return NextResponse.json({ success: false, error: err.message || 'GitHub publish failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, topic, title: seoTitle });
  } catch (error) {
    console.error('Auto-publish failed:', error);
    const message = error instanceof Error ? error.message : 'Auto-publish failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
