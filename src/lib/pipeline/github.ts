// GitHub helpers for the auto-publish pipeline.

const ARTICLES_DIR = 'src/content/articles';

function githubConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) {
    throw new Error('Missing GITHUB_OWNER, GITHUB_REPO or GITHUB_TOKEN');
  }
  return { owner, repo, token };
}

export interface ExistingArticle {
  slug: string;
  /** Title guessed from the slug (good enough for duplicate detection). */
  title: string;
}

export async function listExistingArticles(): Promise<ExistingArticle[]> {
  const { owner, repo, token } = githubConfig();
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${ARTICLES_DIR}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    // Fail closed: without the list we cannot avoid duplicates.
    throw new Error(`Could not list existing articles (GitHub ${res.status})`);
  }
  const files = await res.json();
  if (!Array.isArray(files)) throw new Error('Unexpected GitHub response when listing articles');
  return files
    .filter((f: { name: string }) => f.name.endsWith('.md'))
    .map((f: { name: string }) => {
      const slug = f.name.replace(/\.md$/, '');
      return { slug, title: slug.replace(/-/g, ' ') };
    });
}

export async function createArticleFile(
  slug: string,
  markdown: string,
  commitMessage: string
): Promise<void> {
  const { owner, repo, token } = githubConfig();
  const path = `${ARTICLES_DIR}/${slug}.md`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  const existing = await fetch(url, { headers, cache: 'no-store' });
  if (existing.ok) throw new Error(`An article already exists at ${path}`);

  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(markdown, 'utf8').toString('base64'),
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ message: 'Unknown GitHub error' }));
    throw new Error(`GitHub publish failed: ${detail.message || res.status}`);
  }
}

export async function triggerDeployHook(): Promise<void> {
  const hook = process.env.VERCEL_DEPLOY_HOOK;
  if (!hook) return;
  try {
    await fetch(hook, { method: 'POST' });
  } catch {
    // A failed hook must never fail the publish.
  }
}
