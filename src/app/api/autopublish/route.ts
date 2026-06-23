export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.BASE_URL;

  if (!baseUrl) {
    return NextResponse.json({ error: 'Missing BASE_URL environment variable' }, { status: 500 });
  }

  try {
    // 1. Get a topic
    const researchRes = await fetch(`${baseUrl}/api/research`);
    if (!researchRes.ok) {
      const err = await researchRes.json().catch(() => ({}));
      throw new Error(`Research step failed: ${err.error || researchRes.statusText}`);
    }
    const { topic } = await researchRes.json();
    if (!topic) {
      throw new Error('Research step returned no topic');
    }

    // 2. Generate the article for that topic
    const generateRes = await fetch(`${baseUrl}/api/generate?topic=${encodeURIComponent(topic)}`);
    if (!generateRes.ok) {
      const err = await generateRes.json().catch(() => ({}));
      throw new Error(`Generate step failed: ${err.error || generateRes.statusText}`);
    }
    const article = await generateRes.json();
    if (!article.content || !article.title) {
      throw new Error('Generate step returned incomplete article data');
    }

    // 3. Publish it to GitHub
    const publishRes = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        metaDescription: article.metaDescription,
        tags: article.tags,
        heroImage: article.heroImage,
      }),
    });

    const publishResult = await publishRes.json().catch(() => ({}));

    if (!publishRes.ok) {
      throw new Error(`Publish step failed: ${publishResult.error || publishRes.statusText}`);
    }

    return NextResponse.json({
      success: true,
      topic,
      title: article.title,
      publish: publishResult,
    });
  } catch (error) {
    console.error('Autopublish failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Autopublish failed' },
      { status: 500 }
    );
  }
}
