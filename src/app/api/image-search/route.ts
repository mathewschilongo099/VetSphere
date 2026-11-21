export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

interface StockPhoto {
  id: string;
  thumb: string;
  url: string;
  credit: string;
  source: 'Pexels' | 'Unsplash';
}

async function searchPexels(query: string): Promise<StockPhoto[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
    { headers: { Authorization: key }, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.photos || []) as {
    id: number;
    photographer: string;
    src: { large2x: string; medium: string };
  }[]).map((p) => ({
    id: `pexels-${p.id}`,
    thumb: p.src.medium,
    url: p.src.large2x,
    credit: p.photographer,
    source: 'Pexels' as const,
  }));
}

async function searchUnsplash(query: string): Promise<StockPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=9&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` }, cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.results || []) as {
    id: string;
    urls: { small: string; regular: string };
    user: { name: string };
  }[]).map((p) => ({
    id: `unsplash-${p.id}`,
    thumb: p.urls.small,
    url: p.urls.regular,
    credit: p.user?.name || 'Unknown',
    source: 'Unsplash' as const,
  }));
}

// Stock photo search for choosing a different article photo. Uses the same
// Pexels and Unsplash keys as article generation.
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 80);
  if (!query) return NextResponse.json({ photos: [] });
  if (!process.env.PEXELS_API_KEY && !process.env.UNSPLASH_ACCESS_KEY) {
    return NextResponse.json({
      photos: [],
      error: 'Photo search needs PEXELS_API_KEY or UNSPLASH_ACCESS_KEY to be set.',
    });
  }
  try {
    const [pexels, unsplash] = await Promise.all([
      searchPexels(query).catch(() => []),
      searchUnsplash(query).catch(() => []),
    ]);
    // Interleave so both sources show near the top.
    const photos: StockPhoto[] = [];
    for (let i = 0; i < Math.max(pexels.length, unsplash.length); i++) {
      if (pexels[i]) photos.push(pexels[i]);
      if (unsplash[i]) photos.push(unsplash[i]);
    }
    return NextResponse.json({ photos });
  } catch {
    return NextResponse.json({ photos: [], error: 'Photo search failed. Try again.' });
  }
}
