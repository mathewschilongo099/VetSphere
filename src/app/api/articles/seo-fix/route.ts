export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { commitChanges, fetchAllArticles, isSafeArticleName } from '@/lib/admin/github';
import { planSeoFixes } from '@/lib/seo-fix';

// Repairs titles and meta descriptions that are the wrong length, on every
// published or scheduled article, in ONE commit. Send { "dryRun": true } to see
// the changes without saving anything.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const files = await fetchAllArticles(true);
    const plan = planSeoFixes(files).filter((fix) => isSafeArticleName(fix.name));
    const changes = plan.map((fix) => ({ name: fix.name, title: fix.title, description: fix.description }));

    if (dryRun || plan.length === 0) {
      return NextResponse.json({ ok: true, dryRun, changes });
    }

    const result = await commitChanges(
      plan.map((fix) => ({ path: `src/content/articles/${fix.name}`, content: fix.text })),
      `SEO: fix title and description length on ${plan.length} article${plan.length === 1 ? '' : 's'}`
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, dryRun: false, changes });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'SEO fix failed' },
      { status: 500 }
    );
  }
}
