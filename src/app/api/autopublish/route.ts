export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const VETERINARY_KEYWORDS = [
  'cattle', 'cow', 'dairy', 'livestock', 'poultry', 'chicken', 'goat',
  'sheep', 'pig', 'swine', 'dog', 'cat', 'pet', 'animal', 'veterinary',
  'vet', 'farm', 'disease', 'infection', 'parasite', 'vaccine', 'feeding',
  'nutrition', 'breeding', 'health', 'treatment', 'prevention',
  'zoonotic', 'bovine', 'ovine', 'caprine', 'avian', 'equine', 'canine', 'feline',
  'herd', 'flock', 'outbreak', 'epidemic', 'biosecurity',
  'carcass', 'slaughter', 'abattoir', 'meat', 'milk', 'egg',
  'drought', 'flood', 'fodder', 'pasture', 'grazing', 'supplement'
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
    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * results.length);
    return results[randomIndex]?.urls?.regular || '';
  } catch {
    return '';
  }
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
- NO IMAGES, NO IMAGE DESCRIPTIONS, NO CAPTIONS, NO PHOTO CREDITS
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

async function getTrendingVetTopic(): Promise<string> {
  try {
    const gnewsKey = process.env.GNEWS_API_KEY;
    
    if (gnewsKey) {
      console.log('📡 Fetching from GNews API...');
      
      const gnewsRes = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=health&lang=en&country=world&apikey=${gnewsKey}&max=10`,
        { next: { revalidate: 3600 } }
      );
      
      if (gnewsRes.ok) {
        const gnewsData = await gnewsRes.json();
        console.log(`✅ GNews found ${gnewsData.articles?.length || 0} articles`);
        
        if (gnewsData.articles && gnewsData.articles.length > 0) {
          const vetArticles = gnewsData.articles.filter((article: any) =>
            VETERINARY_KEYWORDS.some(keyword =>
              (article.title + ' ' + (article.description || '')).toLowerCase().includes(keyword)
            )
          );
          
          if (vetArticles.length > 0) {
            const randomArticle = vetArticles[Math.floor(Math.random() * vetArticles.length)];
            console.log(`🩺 Veterinary article found: ${randomArticle.title}`);
            return randomArticle.title;
          } else {
            console.log('No veterinary-specific articles, using first news headline');
            return gnewsData.articles[0].title;
          }
        }
      } else {
        console.log('⚠️ GNews API error, falling back to Google News...');
      }
    }

    console.log('📡 Fetching from Google News RSS...');
    
    const feedUrl = 'https://news.google.com/rss/search?q=veterinary+OR+animal+health+OR+livestock+disease&hl=en-US&gl=US&ceid=US:en';
    const res = await fetch(feedUrl);
    const xml = await res.text();
    
    const titles = Array.from(xml.matchAll(/<title>(.*?)<\/title>/g))
      .map(m => m[1])
      .filter(t => t !== 'Google News' && !t.includes(' - Google News'));
    
    console.log(`✅ Google News found ${titles.length} headlines`);
    
    for (const title of titles.slice(0, 20)) {
      if (VETERINARY_KEYWORDS.some(kw => title.toLowerCase().includes(kw))) {
        console.log(`🩺 Veterinary news found: ${title}`);
        return title;
      }
    }

    console.log('📚 No trending news found, using fallback topic list');
    return getFallbackTopic();
    
  } catch (error) {
    console.error('Error fetching trending topic:', error);
    return getFallbackTopic();
  }
}

function getFallbackTopic(): string {
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
    'African Swine Fever',
    'Porcine Reproductive and Respiratory Syndrome',
    'Swine Erysipelas',
    'Rabies Prevention in Dogs',
    'Parvovirus in Dogs',
    'Canine Distemper',
    'Mange in Dogs',
    'Heartworm Disease in Dogs',
    'Kennel Cough in Dogs',
    'How to Keep Your Dog Healthy',
    'Dog Nutrition and Feeding Guide',
    'Puppy Care and Vaccination Schedule',
    'Feline Panleukopenia in Cats',
    'Feline Leukemia Virus',
    'Toxoplasmosis in Cats',
    'How to Keep Your Cat Healthy',
    'Cat Vaccination Schedule for Pet Owners',
    'Mineral Nutrition for Dairy Cattle',
    'Feeding Dairy Cows for Maximum Milk Production',
    'Best Feeding Practices for Goats',
    'Vitamin Deficiencies in Livestock',
    'How to Feed Calves for Healthy Growth',
    'Nutrition for Pregnant Cows',
    'Poultry Feed Formulation for Farmers',
    'Biosecurity Measures on Livestock Farms',
    'How to Set Up a Poultry House',
    'Record Keeping for Livestock Farmers',
    'When to Call a Veterinarian',
    'Water Quality and Animal Health',
    'Vaccination Programs for Livestock Farmers',
    'Deworming Programs for Cattle and Goats',
    'Housing and Shelter for Livestock',
    'How to Manage a Small Dairy Farm',
    'Rotational Grazing for Cattle Health',
    'Cattle Breeding and Reproduction Guide',
    'Signs of Heat in Dairy Cows',
    'Artificial Insemination in Cattle',
    'Pregnancy and Calving Management in Cows',
    'Common Reproductive Problems in Goats',
    'Dystocia and Difficult Births in Cattle',
    'Retained Placenta in Dairy Cows',
    'How to Do a Body Condition Score in Cattle',
    'Signs of Pain and Stress in Animals',
    'Animal Welfare on the Farm',
    'First Aid for Farm Animals',
    'Zoonotic Diseases Farmers Should Know',
    'Heat Stress in Livestock During Summer',
    'How to Spot a Sick Animal Early',
    'Importance of Clean Water for Animal Health',
  ];
  
  return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
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

function cleanContent(content: string): string {
  content = content.replace(
    /##\s+Image\s+\d+[^\n]*\n+(?:-\s+\*\*[^*]+\*\*:[^\n]*\n+)*/gi,
    ''
  );
  content = content.replace(
    /###\s+Image\s+\d+[^\n]*\n+(?:-\s+\*\*[^*]+\*\*:[^\n]*\n+)*/gi,
    ''
  );
  content = content.replace(
    /-\s+\*\*Image Description\*\*:[^\n]*\n+/gi,
    ''
  );
  content = content.replace(
    /-\s+\*\*Caption\*\*:[^\n]*\n+/gi,
    ''
  );
  content = content.replace(
    /\*\*?Photo:[^\n]*via Unsplash[^\n]*\*\*?\n*/gi,
    ''
  );
  content = content.replace(
    /^Photo:[^\n]*\n+/gim,
    ''
  );
  content = content.replace(
    /!\[[^\]]*\]\([^)]*\)\s*\n*/g,
    ''
  );
  content = content.replace(
    /^Image\s+\d+:[^\n]*\n+/gim,
    ''
  );
  content = content.replace(
    /^Source:[^\n]*\n+/gim,
    ''
  );
  content = content.replace(
    /^Credit:[^\n]*\n+/gim,
    ''
  );
  content = content.replace(
    /^Image:[^\n]*\n+/gim,
    ''
  );
  content = content.replace(
    /!\[[^\]]*\]\([^)]*\)\s*"\s*[^"]*\s*"\s*\n*/g,
    ''
  );
  content = content.replace(/\n{3,}/g, '\n\n');
  content = content.trim();
  return content;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        reason: `Topic "${topic}" already published. Skipping.`,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let content: string;
    let seo: any;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      // ✅ Updated to Gemini 2.5 Flash
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const seoPrompt = `
Return ONLY valid JSON, no markdown fences.
Topic: "${topic}"
{
  "primary_keyword": "${topic}",
  "secondary_keywords": ["animal health", "veterinary care"],
  "long_tail_keywords": ["how to treat ${topic}", "symptoms of ${topic}", "prevention of ${topic}"],
  "search_intent": "informational",
  "questions": ["What causes ${topic}?", "How is ${topic} treated?", "Can ${topic} be prevented?"]
}`;

      try {
        const seoResult = await model.generateContent(seoPrompt);
        seo = JSON.parse(extractJson(seoResult.response.text()));
      } catch {
        seo = { primary_keyword: topic, secondary_keywords: [], long_tail_keywords: [], search_intent: 'informational', questions: [] };
      }

      const prompt = `
You are an expert veterinary SEO writer.
PRIMARY KEYWORD: ${seo.primary_keyword}
SECONDARY KEYWORDS: ${seo.secondary_keywords.join(', ')}

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
- Simple English for farmers and students
- Include keywords naturally
- Include at least 5 FAQs
- No citations
- No references section
- NO IMAGES, NO IMAGE DESCRIPTIONS, NO CAPTIONS, NO PHOTO CREDITS
- NO "Image 1:", "Image 2:", etc.
- NO "Photo: ..." anywhere in the article
- Write only the article content with the specified headings`;

      try {
        const result = await model.generateContent(prompt);
        content = result.response.text();
        if (!content || content.trim().length < 200) throw new Error('Too short');
      } catch (genError) {
        console.error('Gemini failed, falling back to you.com:', genError);
        content = await generateWithYouCom(topic);
      }
    } else {
      seo = { primary_keyword: topic, secondary_keywords: [], long_tail_keywords: [], search_intent: 'informational', questions: [] };
      content = await generateWithYouCom(topic);
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
    const seoTitle = topic.charAt(0).toUpperCase() + topic.slice(1) + ': Causes, Symptoms, Treatment and Prevention';
    const metaDescription = buildExcerpt(plainText, 160);
    const tags = [
      topic.toLowerCase(),
      ...topic.toLowerCase().split(' ').filter((w: string) => w.length > 3),
      'animal health',
      'veterinary',
    ].slice(0, 6);

    const heroImage = await getUnsplashImage(topic + ' livestock farm');
    const causesImage = await getUnsplashImage(topic + ' disease');
    const symptomsImage = await getUnsplashImage('sick animal ' + topic);
    const treatmentImage = await getUnsplashImage('veterinarian treatment');
    const preventionImage = await getUnsplashImage('farm biosecurity');

    content = insertAfterHeading(content, /^##\s*Causes? of .*$/im, causesImage, `Causes of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Clinical Signs? and Symptoms? of .*$/im, symptomsImage, `Symptoms of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Treatment of .*$/im, treatmentImage, `Treatment of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Prevention and? Control? of .*$/im, preventionImage, `Prevention of ${topic}`);

    const slug = seoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
excerpt: "${excerpt.replace(/"/g, '\\"')}"
---

${content}
`;

    const path = `src/content/articles/${slug}.md`;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path
