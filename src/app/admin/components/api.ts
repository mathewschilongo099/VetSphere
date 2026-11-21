// Small client-side helpers shared by every admin tab.

import type { ArticleMeta, ArticleStatus } from '@/lib/frontmatter';

export interface AdminArticle extends ArticleMeta {
  name: string;
  slug: string;
  sha: string;
  status: ArticleStatus;
  words: number;
}

// Calls an admin API and returns its JSON. A 401 means the session ended, so
// the page is told to show the login screen again.
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('admin-unauthorized'));
    throw new Error('Your session expired. Please log in again.');
  }
  return (await res.json().catch(() => ({ error: `Server error (${res.status})` }))) as T;
}

export const post = <T = any>(url: string, body: unknown) =>
  api<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const errMsg = (error: unknown, fallback = 'Something went wrong. Try again.') =>
  error instanceof Error ? error.message : fallback;

// Reads and immutably sets a value inside nested objects using "a.b.c" paths.
export const getIn = (obj: any, path: string): any =>
  path.split('.').reduce((o, key) => (o == null ? o : o[key]), obj);

export function setIn(obj: any, path: string, value: unknown): any {
  const [head, ...rest] = path.split('.');
  return {
    ...(obj || {}),
    [head]: rest.length ? setIn(obj?.[head], rest.join('.'), value) : value,
  };
}

export const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};
