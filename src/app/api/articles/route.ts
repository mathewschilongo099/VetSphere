export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/src/content/articles`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return NextResponse.json({ files: [] });
    const files = await res.json();
    if (!Array.isArray(files)) return NextResponse.json({ files: [] });

    const mdFiles = files
      .filter((f: { name: string }) => f.name.endsWith('.md'))
      .map((f: { name: string; sha: string }) => ({
        name: f.name,
        sha: f.sha,
      }));

    return NextResponse.json({ files: mdFiles });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
