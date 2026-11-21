export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { commitChanges, gh, isSafeImageName, repoUrl } from '@/lib/admin/github';

const UPLOAD_DIR = 'public/images/uploads';

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${UPLOAD_DIR}`,
      {
        cache: 'no-store',
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
      .filter((f: { name: string }) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .map((f: { name: string; sha: string; size: number; download_url: string }) => ({
        name: f.name,
        sha: f.sha,
        size: f.size,
        url: `/images/uploads/${f.name}`,
        downloadUrl: f.download_url,
      }))
      // Newest uploads first (file names start with a timestamp).
      .sort((a: { name: string }, b: { name: string }) => b.name.localeCompare(a.name));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

// Deletes one uploaded image.
export async function DELETE(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!isSafeImageName(name)) {
      return NextResponse.json({ success: false, error: 'Invalid file name.' }, { status: 400 });
    }

    const path = `${UPLOAD_DIR}/${name}`;
    const exists = await gh(repoUrl(`/contents/${path}`));
    if (!exists.ok) {
      return NextResponse.json({ success: false, error: 'That image no longer exists.' }, { status: 404 });
    }

    const result = await commitChanges([{ path, content: null }], `Delete image: ${name}`);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
