export const dynamic = 'force-dynamic';

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
      // === CATTLE DISEASES ===
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

      // === POULTRY DISEASES ===
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

      // === GOAT AND SHEEP DISEASES ===
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

      // === PIG DISEASES ===
      'African Swine Fever',
      'Porcine Reproductive and Respiratory Syndrome',
      'Swine Erysipelas',
      'Porcine Circovirus Disease',
      'Classical Swine Fever',

      // === DOG DISEASES AND CARE ===
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

      // === CAT DISEASES AND CARE ===
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

      // === LIVESTOCK NUTRITION ===
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

      // === FARM MANAGEMENT ===
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

      // === REPRODUCTION AND BREEDING ===
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

      // === GENERAL ANIMAL HEALTH ===
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
- Also use related long-tail keywords like "how to ${topic}", "tips for ${topic}", "guide to ${topic}"
- Minimum 1500 words
- The first paragraph must mention the main keyword within the first 100 words
- Use keyword-rich subheadings (H2 and H3)

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
