// Finds candidate photos. Two independent sources (Pexels and Unsplash), so if
// one has no key, is down, or has nothing good, the other supplies pictures.

export interface ImageCandidate {
  /** Stable id used to avoid using the same photo twice. */
  id: string;
  /** Picture to publish. */
  url: string;
  /** Small version used for the picture check. */
  thumb: string;
  /** The photographer's own description of the photo. */
  alt: string;
  source: 'pexels' | 'unsplash';
  width: number;
  height: number;
}

async function getJson(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function searchPexels(query: string, page = 1): Promise<ImageCandidate[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const data = await getJson(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { Authorization: key }
    );
    const photos: any[] = data?.photos ?? [];
    return photos
      .filter((p) => p?.src?.large && p?.src?.medium)
      .map((p) => ({
        id: `pexels-${p.id}`,
        url: String(p.src.large),
        thumb: String(p.src.medium),
        alt: String(p.alt ?? ''),
        source: 'pexels' as const,
        width: Number(p.width) || 0,
        height: Number(p.height) || 0,
      }));
  } catch {
    return [];
  }
}

export async function searchUnsplash(query: string, page = 1): Promise<ImageCandidate[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  try {
    const data = await getJson(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape&content_filter=high`,
      { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }
    );
    const photos: any[] = data?.results ?? [];
    return photos
      .filter((p) => p?.urls?.regular && p?.urls?.small)
      .map((p) => ({
        id: `unsplash-${p.id}`,
        url: String(p.urls.regular),
        thumb: String(p.urls.small),
        alt: String(p.alt_description ?? p.description ?? ''),
        source: 'unsplash' as const,
        width: Number(p.width) || 0,
        height: Number(p.height) || 0,
      }));
  } catch {
    return [];
  }
}

/** Both sources, interleaved so neither one dominates. Wide photos only. */
export async function searchImages(query: string, page = 1): Promise<ImageCandidate[]> {
  const [a, b] = await Promise.all([searchPexels(query, page), searchUnsplash(query, page)]);
  const out: ImageCandidate[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out.filter((c) => c.width === 0 || c.height === 0 || c.width >= c.height * 1.15);
}
