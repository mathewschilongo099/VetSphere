import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { title, content, excerpt } = await request.json();

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const date = new Date().toISOString().split('T')[0];

  // Generate tags from title words
  const tags = title
    .toLowerCase()
    .split(' ')
    .filter((w: string) => w.length > 3)
    .slice(0, 4)
    .map((w: string) => w.replace(/[^a-z]/g, ''));

  const markdown = `---
title: "${title}"
description: "${excerpt}"
date: "${date}"
author: "Mathews Chilongo"
category: "Animal Health"
tags: [${tags.map((t: string) => `"${t}"`).join(', ')}]
image: "/images/articles/cattle-diseases.jpg"
imageAlt: "${title}"
featured: false
---

# ${title}

${content}
`;

  const fileName = `${slug}.md`;
  const path = `src/content/articles/${fileName}`;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add article: ${title}`,
          content: Buffer.from(markdown).toString('base64'),
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
