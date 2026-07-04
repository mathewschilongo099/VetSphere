export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?path=src/content/articles&per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return NextResponse.json({ logs: [] });

    const commits = await res.json();
    if (!Array.isArray(commits)) return NextResponse.json({ logs: [] });

    const logs = commits.map((c: any) => ({
      message: c.commit?.message || '',
      date: c.commit?.author?.date || '',
      sha: c.sha?.slice(0, 7) || '',
      url: c.html_url || '#',
    }));

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
