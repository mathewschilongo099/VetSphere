export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { fetchHeadlines } from '@/lib/pipeline/topics';
import { findDuplicate, titleSimilarity } from '@/lib/pipeline/gate';
import { listExistingArticles } from '@/lib/pipeline/github';

// Suggests topics from what livestock outlets are covering right now. There is
// no fixed topic list: a story only counts as trending when at least two
// different outlets cover it, and anything already on the site is skipped.
export async function GET() {
  try {
    const [headlines, existing] = await Promise.all([
      fetchHeadlines(),
      listExistingArticles().catch(() => [] as Awaited<ReturnType<typeof listExistingArticles>>),
    ]);

    const scored = headlines
      .map((h) => {
        const outlets = new Set<string>([h.source.toLowerCase()]);
        for (const other of headlines) {
          if (other.id !== h.id && titleSimilarity(h.title, other.title) >= 0.25) {
            outlets.add(other.source.toLowerCase());
          }
        }
        return { h, outlets: outlets.size };
      })
      .filter((x) => x.outlets >= 2)
      .filter((x) => !findDuplicate(x.h.title, existing, 0.5))
      .sort((a, b) => b.outlets - a.outlets);

    // Keep suggestions distinct from each other.
    const picked: typeof scored = [];
    for (const item of scored) {
      if (picked.every((p) => titleSimilarity(p.h.title, item.h.title) < 0.3)) picked.push(item);
      if (picked.length >= 5) break;
    }

    if (picked.length === 0) {
      return NextResponse.json(
        {
          error:
            'No trending livestock topic was found that two or more outlets cover and the site has not already published. Try again later or type your own topic.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      topic: picked[0].h.title,
      suggestions: picked.map((p) => ({
        topic: p.h.title,
        outlets: p.outlets,
        source: p.h.source,
        date: p.h.date,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Research route failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}
