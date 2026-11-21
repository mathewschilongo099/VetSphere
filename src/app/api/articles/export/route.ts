export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllArticles } from '@/lib/admin/github';
import { articleStatus, parseArticle, wordCount } from '@/lib/frontmatter';

// Quotes a CSV cell. A leading = + - or @ would be run as a formula when the
// file is opened in Excel or Sheets, so those cells get a leading apostrophe.
const csvCell = (value: unknown) => {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// Backup download. ?format=json (default) holds every article in full;
// ?format=csv is a spreadsheet-friendly index without the article text.
export async function GET(request: NextRequest) {
  try {
    const csv = request.nextUrl.searchParams.get('format') === 'csv';
    const stamp = new Date().toISOString().slice(0, 10);
    const files = await fetchAllArticles(true);

    let payload: string;
    if (csv) {
      const header = ['file', 'title', 'category', 'date', 'status', 'featured', 'tags', 'image', 'words'];
      const rows = files.map((file) => {
        const { meta, body } = parseArticle(file.text);
        return [
          file.name,
          meta.title,
          meta.category,
          meta.date,
          articleStatus(meta),
          meta.featured ? 'yes' : 'no',
          meta.tags.join('; '),
          meta.image,
          wordCount(body),
        ]
          .map(csvCell)
          .join(',');
      });
      payload = [header.join(','), ...rows].join('\n');
    } else {
      payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          count: files.length,
          articles: files.map((f) => ({ file: f.name, content: f.text })),
        },
        null,
        2
      );
    }

    return new NextResponse(payload, {
      headers: {
        'Content-Type': csv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="vetsphere-articles-${stamp}.${csv ? 'csv' : 'json'}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
