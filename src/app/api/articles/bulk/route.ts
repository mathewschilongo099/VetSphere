export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { commitChanges, fetchAllArticles, isSafeArticleName, type FileChange } from '@/lib/admin/github';
import { buildArticle, isAllowedImage, parseArticle, articleStatus, type ArticleMeta } from '@/lib/frontmatter';

const ACTIONS = [
  'feature',
  'draft',
  'publish_now',
  'category',
  'add_tag',
  'remove_tag',
  'rename_tag',
  'rename_category',
  'set_image',
  'replace_image',
] as const;
type Action = (typeof ACTIONS)[number];

// These actions work on the whole site (for example renaming a category), so
// they may leave out "names". Every other action must say which articles to
// change, so a missing list can never hide or edit every article by accident.
const WHOLE_SITE: Action[] = ['rename_tag', 'rename_category', 'replace_image', 'remove_tag'];

const text = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const unique = (tags: string[]) => tags.filter((t, i) => tags.findIndex((x) => same(x, t)) === i);

// Changes many articles in a single commit.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as Action;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    const names: Set<string> | null = Array.isArray(body.names)
      ? new Set<string>(body.names.filter(isSafeArticleName))
      : null;
    if (!WHOLE_SITE.includes(action) && (!names || names.size === 0)) {
      return NextResponse.json({ success: false, error: 'Select at least one article.' }, { status: 400 });
    }

    const flag = body.value === true;
    const value = text(body.value, 500);
    const from = text(body.from, 500);
    const to = text(body.to, 500);

    if (['category', 'add_tag', 'remove_tag', 'set_image'].includes(action) && !value) {
      return NextResponse.json({ success: false, error: 'A value is required.' }, { status: 400 });
    }
    if (['rename_tag', 'rename_category', 'replace_image'].includes(action) && (!from || !to)) {
      return NextResponse.json({ success: false, error: 'Both from and to are required.' }, { status: 400 });
    }
    if (action === 'set_image' && !isAllowedImage(value)) {
      return NextResponse.json(
        { success: false, error: 'That image address is not allowed on this site.' },
        { status: 400 }
      );
    }
    if (action === 'replace_image' && !isAllowedImage(to)) {
      return NextResponse.json(
        { success: false, error: 'That image address is not allowed on this site.' },
        { status: 400 }
      );
    }

    const all = await fetchAllArticles(true);
    const changes: FileChange[] = [];

    for (const file of all) {
      if (names && !names.has(file.name)) continue;
      const { meta } = parseArticle(file.text);
      let patch: Partial<ArticleMeta> | null = null;

      switch (action) {
        case 'feature':
          if (meta.featured !== flag) patch = { featured: flag };
          break;
        case 'draft':
          if (!meta.draft) patch = { draft: true, publishDate: '' };
          break;
        case 'publish_now':
          if (articleStatus(meta) !== 'published') patch = { draft: false, publishDate: '' };
          break;
        case 'category':
          if (meta.category !== value) patch = { category: value };
          break;
        case 'add_tag':
          if (!meta.tags.some((t) => same(t, value))) patch = { tags: [...meta.tags, value] };
          break;
        case 'remove_tag':
          if (meta.tags.some((t) => same(t, value))) {
            patch = { tags: meta.tags.filter((t) => !same(t, value)) };
          }
          break;
        case 'rename_tag':
          if (meta.tags.some((t) => same(t, from))) {
            patch = { tags: unique(meta.tags.map((t) => (same(t, from) ? to : t))) };
          }
          break;
        case 'rename_category':
          if (same(meta.category, from) && meta.category !== to) patch = { category: to };
          break;
        case 'set_image':
          if (meta.image !== value) patch = { image: value };
          break;
        case 'replace_image':
          if (meta.image === from) patch = { image: to };
          break;
      }

      if (patch) {
        changes.push({
          path: `src/content/articles/${file.name}`,
          content: buildArticle(file.text, patch),
        });
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ success: true, changed: 0 });
    }

    const result = await commitChanges(
      changes,
      `Update articles (${action}): ${changes.length} file${changes.length === 1 ? '' : 's'}`
    );
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, changed: changes.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Bulk update failed' },
      { status: 500 }
    );
  }
}
