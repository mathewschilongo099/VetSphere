export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { commitChanges, fetchAllArticles, isSafeArticleName } from '@/lib/admin/github';

// Deletes the chosen articles in ONE commit, so deleting many articles starts a
// single site rebuild instead of one per article.
export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();
    const requested: string[] = (Array.isArray(files) ? files : [])
      .map((f: { name?: unknown }) => f?.name)
      .filter(isSafeArticleName);

    if (requested.length === 0) {
      return NextResponse.json({ success: false, deleted: 0, error: 'No articles selected.' }, { status: 400 });
    }

    const existing = new Set((await fetchAllArticles(true)).map((f) => f.name));
    const toDelete = requested.filter((name) => existing.has(name));
    if (toDelete.length === 0) {
      return NextResponse.json({ success: false, deleted: 0, error: 'Those articles no longer exist.' });
    }

    const result = await commitChanges(
      toDelete.map((name) => ({ path: `src/content/articles/${name}`, content: null })),
      `Delete article: ${toDelete.join(', ').slice(0, 150)}`
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, deleted: 0, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, deleted: toDelete.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, deleted: 0, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
