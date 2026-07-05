export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const filename = `${params.slug}.md`;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    return NextResponse.json({ content, sha: data.sha, name: filename });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
