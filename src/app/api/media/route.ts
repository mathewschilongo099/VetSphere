export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/public/images/uploads`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return NextResponse.json({ images: [] });

    const files = await res.json();
    if (!Array.isArray(files)) return NextResponse.json({ images: [] });

    const images = files
      .filter((f: { name: string }) =>
        /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name)
      )
      .map((f: { name: string; sha: string; download_url: string }) => ({
        name: f.name,
        sha: f.sha,
        url: `/images/uploads/${f.name}`,
        downloadUrl: f.download_url,
      }));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
