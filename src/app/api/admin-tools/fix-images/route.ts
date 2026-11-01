// Checks the pictures in an existing article with an AI that can see them and,
// when asked, replaces any that show the wrong animal. One article per call so
// each call stays inside the 60 second limit. Admin only.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import matter from 'gray-matter';
import { NextRequest, NextResponse } from 'next/server';
import { imageTag, listBodyImages } from '@/lib/images/insert';
import { pickImage } from '@/lib/images/pick';
import { detectSubject } from '@/lib/images/subjects';
import { verifyImage } from '@/lib/images/verify';
import { getArticleFile, listExistingArticles, updateArticleFile } from '@/lib/pipeline/github';

interface ItemResult {
  where: 'hero' | 'inline';
  url: string;
  status: 'ok' | 'wrong' | 'unchecked' | 'replaced' | 'removed' | 'no-replacement' | 'unreachable';
  reason?: string;
  newUrl?: string;
}

export async function GET() {
  try {
    const articles = await listExistingArticles();
    return NextResponse.json({ ok: true, slugs: articles.map((a) => a.slug).sort() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const deadlineMs = Date.now() + 55000;
  try {
    const { slug, apply } = (await request.json().catch(() => ({}))) as { slug?: string; apply?: boolean };
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ ok: false, error: 'A valid slug is required' }, { status: 400 });
    }

    const file = await getArticleFile(slug);
    const parsed = matter(file.content);
    const title = String(parsed.data.title ?? slug);
    const tags: string[] = Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : [];
    const subject = detectSubject({ title, tags, body: parsed.content });

    const heroUrl = String(parsed.data.image ?? '');
    const targets: Array<{ where: 'hero' | 'inline'; url: string; tag?: string }> = [];
    if (/^https?:\/\//.test(heroUrl)) targets.push({ where: 'hero', url: heroUrl });
    for (const img of listBodyImages(parsed.content)) {
      if (/^https?:\/\//.test(img.url)) targets.push({ where: 'inline', url: img.url, tag: img.tag });
    }

    // Look at every picture at the same time.
    const verdicts = await Promise.all(
      targets.map((t) => verifyImage({ thumbUrl: t.url, subject, topic: title, deadlineMs }))
    );

    const results: ItemResult[] = [];
    let updated = file.content;
    const exclude = new Set<string>();
    const log: string[] = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const verdict = verdicts[i];

      if (!verdict.checked) {
        results.push({ where: target.where, url: target.url, status: 'unchecked', reason: verdict.reason });
        continue;
      }
      if (verdict.ok) {
        results.push({ where: target.where, url: target.url, status: 'ok' });
        continue;
      }

      const unreachable = /download failed|unsupported picture|empty or too large/.test(verdict.reason);
      if (!apply) {
        results.push({ where: target.where, url: target.url, status: unreachable ? 'unreachable' : 'wrong', reason: verdict.reason });
        continue;
      }

      const replacement = await pickImage({
        subject,
        topic: title,
        exclude,
        deadlineMs,
        allowDescriptionOnly: false,
        seed: i,
        log,
      });

      if (target.where === 'hero') {
        if (!replacement) {
          results.push({ where: 'hero', url: target.url, status: 'no-replacement', reason: verdict.reason });
          continue;
        }
        updated = updated.split(target.url).join(replacement.url);
        updated = updated.replace(/^imageAlt:.*$/m, `imageAlt: ${JSON.stringify(replacement.alt)}`);
        results.push({ where: 'hero', url: target.url, status: 'replaced', reason: verdict.reason, newUrl: replacement.url });
      } else if (replacement) {
        updated = updated.replace(target.tag!, imageTag(replacement));
        results.push({ where: 'inline', url: target.url, status: 'replaced', reason: verdict.reason, newUrl: replacement.url });
      } else {
        // A missing picture is better than a wrong one.
        updated = updated.replace(target.tag!, '').replace(/\n{3,}/g, '\n\n');
        results.push({ where: 'inline', url: target.url, status: 'removed', reason: verdict.reason });
      }
    }

    const changed = updated !== file.content;
    if (changed && apply) {
      await updateArticleFile(slug, updated, file.sha, `Fix pictures in "${title}" (checked by AI)`);
    }

    return NextResponse.json({ ok: true, slug, title, subject: subject.label, changed: changed && !!apply, results, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Failed' }, { status: 500 });
  }
}
