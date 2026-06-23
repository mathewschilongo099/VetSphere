export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const VETERINARY_KEYWORDS = [
  'cattle','cow','dairy','livestock','poultry','goat','sheep','pig','dog','cat',
  'veterinary','disease','infection','treatment','animal health'
];

async function getTrendingTopic(): Promise<string> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US&hl=en');
    const xml = await res.text();

    const titles = Array.from(xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
      .map(m => m[1])
      .filter(t => t !== 'Google Trends');

    const vetTopic = titles.find(t =>
      VETERINARY_KEYWORDS.some(k => t.toLowerCase().includes(k))
    );

    return vetTopic || 'Lumpy Skin Disease in Cattle';
  } catch {
    return 'Lumpy Skin Disease in Cattle';
  }
}

async function generateArticle(topic: string) {
  const res = await fetch(`${process.env.BASE_URL}/api/generate?topic=${encodeURIComponent(topic)}`);
  if (!res.ok) throw new Error('Generate failed');
  return res.json();
}

async function publishArticle(data: any) {
  const res = await fetch(`${process.env.BASE_URL}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Publish failed');
  return res.json();
}

export async function GET() {
  try {
    // 1. Get topic
    const topic = await getTrendingTopic();

    // 2. Generate article using Gemini system
    const article = await generateArticle(topic);

    // 3. Publish to GitHub
    const result = await publishArticle({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      metaDescription: article.metaDescription,
      tags: article.tags,
      heroImage: article.heroImage,
    });

    return NextResponse.json({
      success: true,
      topic,
      published: true,
      result,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Autopublish failed'
    }, { status: 500 });
  }
}
