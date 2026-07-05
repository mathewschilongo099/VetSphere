export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json();

    if (!filename || !content) {
      return NextResponse.json({ error: 'filename and content are required' }, { status: 400 });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const path = `src/content/articles/${filename}`;
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Check if already exists
    const existingRes = await fetch(contentsUrl, { headers });
    if (existingRes.ok) {
      return NextResponse.json({
        success: false,
        error: 'An article with this title already exists.',
      });
    }

    const res = await fetch(contentsUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Add article: ${filename}`,
        content: Buffer.from(content).toString('base64'),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    if (process.env.VERCEL_DEPLOY_HOOK) {
      await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 });
  }
}
