export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllArticles } from '@/lib/admin/github';
import { articleStatus, parseArticle, wordCount } from '@/lib/frontmatter';

// Lists every article with its front matter (title, category, tags, image,
// draft/scheduled status, word count). Add ?fresh=1 to skip the short cache.
export async function GET(request: NextRequest) {
  try {
    const fresh = request.nextUrl.searchParams.get('fresh') === '1';
    const raw = await fetchAllArticles(fresh);
    const articles = raw
      .map((file) => {
        const { meta, body } = parseArticle(file.text);
        return {
          name: file.name,
          slug: file.name.replace(/\.md$/, ''),
          sha: file.sha,
          ...meta,
          status: articleStatus(meta),
          words: wordCount(body),
        };
      })
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    return NextResponse.json({ articles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load articles' },
      { status: 500 }
    );
  }
}
