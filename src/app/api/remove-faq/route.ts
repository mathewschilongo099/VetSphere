import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return NextResponse.json({ error: 'Missing GitHub credentials' }, { status: 500 });
    }

    const path = `src/content/articles/${fileName}`;
    
    // Get the file
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!getRes.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileData = await getRes.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

    // Remove FAQ section
    const cleanedContent = content
      .replace(/##\s*Frequently Asked Questions About.*?([\s\S]*?)(?=##|$)/gi, '')
      .replace(/##\s*Frequently Asked Questions.*$/i, '')
      .replace(/\d+\.\s*\*\*.*?\?\*\*[\s\S]*?(?=\d+\.\s*\*\*|##|$)/g, '')
      .replace(/^\s*Frequently Asked Questions\s*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Update the file on GitHub
    const updateRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Remove FAQ from ${fileName}`,
          content: Buffer.from(cleanedContent).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      return NextResponse.json({ error: err.message }, { status: updateRes.status });
    }

    return NextResponse.json({ success: true, message: 'FAQ removed successfully' });

  } catch (error) {
    console.error('Remove FAQ error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove FAQ' },
      { status: 500 }
    );
  }
}
