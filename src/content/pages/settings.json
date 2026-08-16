export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const filename = `${params.page}.json`;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/pages/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));

    return NextResponse.json({ content, sha: data.sha });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { page: string } }
) {
  try {
    const { content, sha } = await request.json();
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const filename = `${params.page}.json`;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/pages/${filename}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update ${filename} from admin`,
          content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
          sha,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    if (process.env.VERCEL_DEPLOY_HOOK) {
      await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
