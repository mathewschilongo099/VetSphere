export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { files } = await request.json();

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  let successCount = 0;

  for (const file of files) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles/${file.name}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Delete article: ${file.name}`,
            sha: file.sha,
          }),
        }
      );
      if (res.ok) successCount++;
    } catch {
      // continue
    }
  }

  if (process.env.VERCEL_DEPLOY_HOOK) {
    await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
  }

  return NextResponse.json({ success: successCount > 0, deleted: successCount });
}
