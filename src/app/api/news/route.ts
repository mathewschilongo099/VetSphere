export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const feedUrl = 'https://news.google.com/rss/search?q=veterinary+livestock+animal+health+disease&hl=en-US&gl=US&ceid=US:en';
    const res = await fetch(feedUrl);
    const xml = await res.text();

    const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(m => m[1]);

    const news = items.slice(0, 10).map(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || '#';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || '';
      const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1]?.trim() || '';
      return { title, link, pubDate, source };
    }).filter(item => item.title);

    return NextResponse.json({ news });
  } catch (error) {
    return NextResponse.json({ news: [], error: 'Failed to fetch news' });
  }
}
