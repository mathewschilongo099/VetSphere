// Server-side GitHub helpers used by the admin API routes. Articles and images
// live in the repository, so every admin change is a commit.

const API = 'https://api.github.com';

export const SAFE_ARTICLE_NAME = /^[a-z0-9][a-z0-9._-]*\.md$/i;
export const SAFE_IMAGE_NAME = /^[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|gif)$/i;

export const isSafeArticleName = (name: unknown): name is string =>
  typeof name === 'string' && !name.includes('..') && SAFE_ARTICLE_NAME.test(name);

export const isSafeImageName = (name: unknown): name is string =>
  typeof name === 'string' && !name.includes('..') && SAFE_IMAGE_NAME.test(name);

export function ghConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) {
    throw new Error('GitHub is not configured (GITHUB_OWNER, GITHUB_REPO and GITHUB_TOKEN are required).');
  }
  return { owner, repo, token };
}

export async function gh(path: string, init: RequestInit = {}): Promise<Response> {
  const { token } = ghConfig();
  return fetch(`${API}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    },
  });
}

export function repoUrl(suffix: string): string {
  const { owner, repo } = ghConfig();
  return `/repos/${owner}/${repo}${suffix}`;
}

async function errorText(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json.message || `GitHub error ${res.status}`;
  } catch {
    return `GitHub error ${res.status}`;
  }
}

let branchCache: string | null = null;

export async function defaultBranch(): Promise<string> {
  if (process.env.GITHUB_BRANCH) return process.env.GITHUB_BRANCH;
  if (branchCache) return branchCache;
  const res = await gh(repoUrl(''));
  if (!res.ok) throw new Error('Could not read the repository.');
  const json = await res.json();
  branchCache = (json.default_branch as string) || 'main';
  return branchCache;
}

export async function triggerDeploy(): Promise<boolean> {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) return false;
  try {
    const res = await fetch(hook, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface FileChange {
  path: string;
  /** New text content, or null to delete the file. */
  content: string | null;
}

// Applies several file changes as ONE commit (so bulk edits do not start one
// site rebuild per file) and then asks Vercel to rebuild.
export async function commitChanges(
  changes: FileChange[],
  message: string
): Promise<{ ok: true; sha: string } | { ok: false; error: string }> {
  try {
    const branch = await defaultBranch();
    for (let attempt = 0; attempt < 3; attempt++) {
      const refRes = await gh(repoUrl(`/git/ref/heads/${branch}`));
      if (!refRes.ok) return { ok: false, error: await errorText(refRes) };
      const headSha: string = (await refRes.json()).object.sha;

      const headCommit = await gh(repoUrl(`/git/commits/${headSha}`));
      if (!headCommit.ok) return { ok: false, error: await errorText(headCommit) };
      const baseTree: string = (await headCommit.json()).tree.sha;

      const tree = changes.map((c) =>
        c.content === null
          ? { path: c.path, mode: '100644', type: 'blob', sha: null }
          : { path: c.path, mode: '100644', type: 'blob', content: c.content }
      );
      const treeRes = await gh(repoUrl('/git/trees'), {
        method: 'POST',
        body: JSON.stringify({ base_tree: baseTree, tree }),
      });
      if (!treeRes.ok) return { ok: false, error: await errorText(treeRes) };
      const newTree: string = (await treeRes.json()).sha;

      const commitRes = await gh(repoUrl('/git/commits'), {
        method: 'POST',
        body: JSON.stringify({ message, tree: newTree, parents: [headSha] }),
      });
      if (!commitRes.ok) return { ok: false, error: await errorText(commitRes) };
      const newSha: string = (await commitRes.json()).sha;

      const update = await gh(repoUrl(`/git/refs/heads/${branch}`), {
        method: 'PATCH',
        body: JSON.stringify({ sha: newSha }),
      });
      if (update.ok) {
        clearArticleCache();
        await triggerDeploy();
        return { ok: true, sha: newSha };
      }
      // 422 means someone else committed in between (for example the
      // scheduled auto-publish). Retry from the new head.
      if (update.status !== 422) return { ok: false, error: await errorText(update) };
    }
    return { ok: false, error: 'The repository changed while saving. Please try again.' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Commit failed' };
  }
}

// ── Reading every article at once ──

export interface RawArticle {
  name: string;
  sha: string;
  text: string;
}

let articleCache: { at: number; data: RawArticle[] } | null = null;
const CACHE_MS = 20 * 1000;

export function clearArticleCache() {
  articleCache = null;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// One GraphQL request returns every article. Returns null when GraphQL is not
// usable so the caller can fall back to the REST API.
async function viaGraphQL(): Promise<RawArticle[] | null> {
  try {
    const { owner, repo, token } = ghConfig();
    const branch = await defaultBranch();
    const query =
      'query($owner:String!,$repo:String!,$exp:String!){repository(owner:$owner,name:$repo){object(expression:$exp){... on Tree{entries{name object{oid ... on Blob{text isTruncated}}}}}}}';
    const res = await fetch(`${API}/graphql`, {
      method: 'POST',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { owner, repo, exp: `${branch}:src/content/articles` },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const entries = json?.data?.repository?.object?.entries;
    if (!Array.isArray(entries)) return null;

    const out: RawArticle[] = [];
    for (const entry of entries) {
      if (!String(entry.name).endsWith('.md')) continue;
      if (typeof entry.object?.text !== 'string' || entry.object.isTruncated) return null;
      out.push({ name: entry.name, sha: entry.object.oid, text: entry.object.text });
    }
    return out;
  } catch {
    return null;
  }
}

async function viaRest(): Promise<RawArticle[]> {
  const branch = await defaultBranch();
  const res = await gh(repoUrl(`/contents/src/content/articles?ref=${encodeURIComponent(branch)}`));
  if (!res.ok) return [];
  const list = await res.json();
  if (!Array.isArray(list)) return [];
  const files = list.filter((f: { name: string }) => f.name.endsWith('.md')) as {
    name: string;
    sha: string;
  }[];
  const loaded = await mapLimit(files, 8, async (file) => {
    const blob = await gh(repoUrl(`/git/blobs/${file.sha}`));
    if (!blob.ok) return null;
    const json = await blob.json();
    return {
      name: file.name,
      sha: file.sha,
      text: Buffer.from(json.content as string, 'base64').toString('utf8'),
    } as RawArticle;
  });
  return loaded.filter((x): x is RawArticle => x !== null);
}

export async function fetchAllArticles(force = false): Promise<RawArticle[]> {
  if (!force && articleCache && Date.now() - articleCache.at < CACHE_MS) {
    return articleCache.data;
  }
  const data = (await viaGraphQL()) ?? (await viaRest());
  articleCache = { at: Date.now(), data };
  return data;
}
