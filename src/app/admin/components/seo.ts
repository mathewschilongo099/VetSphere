import type { AdminArticle } from './api';

export type SeoIssueId =
  | 'noDescription'
  | 'descLength'
  | 'titleLength'
  | 'noImage'
  | 'noAlt'
  | 'noTags'
  | 'noCategory'
  | 'thin'
  | 'dupTitle';

export const SEO_ISSUES: Record<SeoIssueId, string> = {
  noDescription: 'No meta description',
  descLength: 'Meta description should be 70 to 160 characters',
  titleLength: 'Title should be 20 to 65 characters',
  noImage: 'No photo',
  noAlt: 'Photo has no description (alt text)',
  noTags: 'No tags',
  noCategory: 'No category',
  thin: 'Under 300 words',
  dupTitle: 'Same title as another article',
};

// Returns the problems found for each article (articles with no problems are
// left out of the map).
export function auditArticles(articles: AdminArticle[]): Map<string, SeoIssueId[]> {
  const titles = new Map<string, number>();
  for (const a of articles) {
    const key = a.title.trim().toLowerCase();
    if (key) titles.set(key, (titles.get(key) || 0) + 1);
  }

  const result = new Map<string, SeoIssueId[]>();
  for (const a of articles) {
    const issues: SeoIssueId[] = [];
    const desc = a.description.trim().length;
    if (!desc) issues.push('noDescription');
    else if (desc < 70 || desc > 160) issues.push('descLength');

    const title = a.title.trim().length;
    if (title < 20 || title > 65) issues.push('titleLength');

    if (!a.image) issues.push('noImage');
    else if (!a.imageAlt.trim()) issues.push('noAlt');

    if (a.tags.length === 0) issues.push('noTags');
    if (!a.category) issues.push('noCategory');
    if (a.words < 300) issues.push('thin');
    if ((titles.get(a.title.trim().toLowerCase()) || 0) > 1) issues.push('dupTitle');

    if (issues.length) result.set(a.name, issues);
  }
  return result;
}
