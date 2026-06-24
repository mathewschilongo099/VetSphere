export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

function topicToSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, metaDescription, tags = [], heroImage } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    // Strip leading H1 if present to avoid duplicate title on the page
    const cleanedContent = content.replace(/^\s*#\s+.+\n+/, '');

    const slug = topicToSlug(title);
    const date = new Date().toISOString().split('T')[0];
    const safeDescription = (metaDescription || '').replace(/"/g, '\\"').slice(0, 160);
    const safeTags = tags.length > 0 ? tags : ['animal health', 'veterinary'];

    const markdown = `---
title: "${title}"
description: "${safeDescription}"
date: "${date}"
author: "Mathews Chilongo"
category: "Animal Health"
tags: [${safeTags.map((t: string) => `"${t}"`).join(', ')}]
image: "${heroImage || '/images/articles/cattle-diseases.jpg'}"
imageAlt: "${title}"
featured: false
---

${cleanedContent}
`;

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return NextResponse.json({ error: 'Missing GitHub environment variables' }, { status: 500 });
    }

    const path = `src/content/articles/${slug}.md`;
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Check if file already exists to avoid conflict
    let existingSha: string | undefined;
    try {
      const existingRes = await fetch(contentsUrl, { headers });
      if (existingRes.ok) {
        const existingData = await existingRes.json();
        existingSha = existingData.sha;
      }
    } catch {
      // Fall through and attempt normal create
    }

    if (existingSha) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: `An article already exists at "${path}". Skipping to avoid overwriting.`,
      });
    }

    const githubRes = await fetch(contentsUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `Add article: ${title}`,
        content: Buffer.from(markdown).toString('base64'),
      }),
    });

    if (!githubRes.ok) {
      const err = await githubRes.json().catch(() => ({ message: 'Unknown GitHub API error' }));
      return NextResponse.json(
        { success: false, error: err.message || 'GitHub publish failed' },
        { status: 500 }
      );
    }

    // Trigger Vercel redeploy so article appears immediately
    if (process.env.VERCEL_DEPLOY_HOOK) {
      try {
        await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
      } catch {
        // Don't fail publish if deploy hook fails
      }
    }

    return NextResponse.json({ success: true, slug, path, title });
  } catch (error) {
    console.error('Publish route failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error
