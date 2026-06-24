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
  'drought', 'flood', 'fodder', 'pasture', 'grazing', 'supplement',
  'calving', 'lambing', 'birthing', 'breeding', 'gestation',
  'rumen', 'abomasum', 'udder', 'mastitis', 'hoof', 'horn',
  'liver', 'kidney', 'heart', 'lung', 'skin', 'coat', 'feather',
  'beak', 'claw', 'paw', 'tail', 'ear', 'eye', 'nose',
  'vaccination', 'deworming', 'antibiotic', 'probiotic',
  'pregnant', 'newborn', 'calf', 'lamb', 'kid', 'foal', 'puppy', 'kitten',
  'surgery', 'wound', 'injury', 'fracture', 'poisoning', 'toxin',
  'bacteria', 'virus', 'fungal', 'protozoa', 'infection',
  'respiratory', 'digestive', 'reproductive', 'neurological', 'skin',
  'ruminant', 'monogastric', 'pasture', 'fodder', 'silage', 'hay'
];

const NON_VET_KEYWORDS = [
  'prime day', 'sale', 'discount', 'deal', 'coupon', 'promo',
  'vacuum', 'cleaner', 'gadget', 'tech', 'electronics',
  'amazon', 'walmart', 'target', 'shop', 'shopping',
  'watch', 'movie', 'music', 'video', 'streaming',
  'politics', 'election', 'government', 'president',
  'weather', 'storm', 'hurricane', 'tornado', 'earthquake',
  'stock', 'market', 'investment', 'crypto',
  'celebrity', 'entertainment', 'fashion'
];

const FALLBACK_IMAGES = [
  'https://images.pexels.com/photos/18351958/pexels-photo-18351958/free-photo-of-a-cow-standing-in-a-field-next-to-a-tree.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351948/pexels-photo-18351948/free-photo-of-a-group-of-chickens-in-a-pen.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351947/pexels-photo-18351947/free-photo-of-a-goat-standing-in-a-field.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351941/pexels-photo-18351941/free-photo-of-a-veterinarian-examining-a-dog.jpeg?w=800&h=400&fit=crop',
  'https://images.pexels.com/photos/18351938/pexels-photo-18351938/free-photo-of-a-veterinarian-holding-a-cat.jpeg?w=800&h=400&fit=crop',
];

function isValidVeterinaryTopic(topic: string): boolean {
  const lowerTopic = topic.toLowerCase();
  
  for (const keyword of NON_VET_KEYWORDS) {
    if (lowerTopic.includes(keyword)) {
      console.log(`❌ Rejected: Contains non-vet keyword "${keyword}"`);
      return false;
    }
  }
  
  let matchCount = 0;
  for (const keyword of VETERINARY_KEYWORDS) {
    if (lowerTopic.includes(keyword)) {
      matchCount++;
    }
  }
  
  if (matchCount < 2) {
    console.log(`❌ Rejected: Only ${matchCount} veterinary keyword matches (need 2)`);
    return false;
  }
  
  console.log(`✅ Accepted: ${matchCount} veterinary keyword matches`);
  return true;
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

async function getTrendingVetTopic(): Promise<string> {
  try {
    console.log('📡 Fetching veterinary news from Google News RSS...');
    
    const feedUrl = 'https://news.google.com/rss/search?q=veterinary+OR+livestock+disease+OR+animal+health+OR+cattle+disease+OR+poultry+disease&hl=en-US&gl=US&ceid=US:en';
    const res = await fetch(feedUrl);
    const xml = await res.text();
    
    const titles = Array.from(xml.matchAll(/<title>(.*?)<\/title>/g))
      .map(m => m[1])
      .filter(t => t !== 'Google News' && !t.includes(' - Google News'));
    
    console.log(`✅ Found ${titles.length} news headlines`);
    
    for (const title of titles.slice(0, 30)) {
      if (isValidVeterinaryTopic(title)) {
        console.log(`🩺 Valid veterinary topic found: ${title}`);
        return title;
      }
    }

    console.log('📚 No valid trending topic found, using fallback topic list');
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
    'Lumpy Skin Disease in Cattle',
    'Anthrax in Livestock',
    'Bloat in Cattle',
    'Foot and Mouth Disease in Cattle',
    'Newcastle Disease in Poultry',
    'Avian Influenza in Poultry',
    'Coccidiosis in Poultry',
    'Foot Rot in Goats',
    'Peste des Petits Ruminants in Goats',
    'Contagious Caprine Pleuropneumonia in Goats',
    'African Swine Fever',
    'Rabies Prevention in Dogs',
    'Parvovirus in Dogs',
    'Canine Distemper',
    'Feline Panleukopenia in Cats',
    'Feline Leukemia Virus',
    'Poultry Feed Formulation for Farmers',
    'Biosecurity Measures on Livestock Farms',
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

async function findRelatedArticles(topic: string, currentSlug: string): Promise<string[]> {
  try {
    const existingSlugs = await getExistingSlugs();
    const keywords = topic.toLowerCase().split(' ');
    
    const scored = existingSlugs.map(slug => {
      if (slug === currentSlug) return { slug, score: 0 };
      const slugWords = slug.replace(/-/g, ' ').toLowerCase().split(' ');
      let score = 0;
      for (const kw of keywords) {
        if (slugWords.some((sw: string) => sw.includes(kw) || kw.includes(sw))) {
          score++;
        }
      }
      return { slug, score };
    });
    
    const sorted = scored.sort((a, b) => b.score - a.score);
    const top = sorted.filter(s => s.score > 0).slice(0, 3);
    
    if (top.length === 0) {
      const available = existingSlugs.filter(s => s !== currentSlug);
      const shuffled = available.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }
    
    return top.map(s => s.slug);
  } catch {
    return [];
  }
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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const topic = await getTrendingVetTopic();
    console.log('📝 Auto-publishing topic:', topic);

    const existingSlugs = await getExistingSlugs();
    const slug = topicToSlug(topic);
    const alreadyPublished = existingSlugs.some(s => s.startsWith(slug));

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
You are an expert veterinary SEO writer and content creator.
PRIMARY KEYWORD: ${seo.primary_keyword}
SECONDARY KEYWORDS: ${seo.secondary_keywords.join(', ')}

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

    const relatedSlugs = await findRelatedArticles(topic, slug);
    let relatedSection = '';
    if (relatedSlugs.length > 0) {
      relatedSection = '\n\n## Related Articles\n\n';
      for (const relatedSlug of relatedSlugs) {
        const title = relatedSlug.replace(/-/g, ' ');
        relatedSection += `- [${title}](/articles/${relatedSlug})\n`;
      }
    }

    const conclusionIndex = content.indexOf('## Conclusion');
    if (conclusionIndex !== -1) {
      content = content.substring(0, conclusionIndex) + relatedSection + '\n\n' + content.substring(conclusionIndex);
    } else {
      content = content + relatedSection;
    }

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

    const heroImage = await getArticleImage(topic);
    const causesImage = await getArticleImage(`${topic} disease`);
    const symptomsImage = await getArticleImage(`sick animal`);
    const treatmentImage = await getArticleImage(`veterinarian`);
    const preventionImage = await getArticleImage(`farm biosecurity`);

    content = insertAfterHeading(content, /^##\s*Causes? of .*$/im, causesImage, `Causes of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Clinical Signs? and Symptoms? of .*$/im, symptomsImage, `Symptoms of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Treatment of .*$/im, treatmentImage, `Treatment of ${topic}`);
    content = insertAfterHeading(content, /^##\s*Prevention and? Control? of .*$/im, preventionImage, `Prevention of ${topic}`);

    const finalSlug = seoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const date = new Date().toISOString().split('T')[0];

    const markdown = `---
title: "${seoTitle}"
description: "${metaDescription.replace(/"/g, '\\"')}"
date: "${date}"
author: "VetSphere"
category: "Animal Health"
tags: [${tags.map((t: string) => `"${t}"`).join(', ')}]
image: "${heroImage}"
imageAlt: "${seoTitle}"
featured: false
excerpt: "${excerpt.replace(/"/g, '\\"')}"
---

${content}
`;

    const path = `src/content/articles/${finalSlug}.md`;
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

    if (process.env.VERCEL_DEPLOY_HOOK) {
      try {
        await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
      } catch {
        // Don't fail if deploy hook fails
      }
    }

    return NextResponse.json({ success: true, topic, title: seoTitle });
  } catch (error) {
    console.error('Auto-publish failed:', error);
    return NextResponse.json({ success: false, error: 'Auto-publish failed' }, { status: 500 });
  }
}
