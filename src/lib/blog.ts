import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { BlogPost } from '@/types';
import { resolveCategory } from '@/lib/categories';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const POSTS_DIRECTORY = path.join(process.cwd(), 'src/content/articles');

// Tags that are too general to say two articles are really related.
const GENERIC_TAGS = new Set([
  'veterinary',
  'animal health',
  'livestock',
  'farming',
  'vetsphere',
  'animals',
  'health',
]);

// Drafts (draft: true) and scheduled articles (publishDate in the future) are
// hidden from the public site. A scheduled article appears on the first site
// build after its publish date.
function isLive(data: { draft?: unknown; publishDate?: unknown }): boolean {
  if (data.draft === true || String(data.draft).toLowerCase() === 'true') return false;
  if (data.publishDate) {
    const time = new Date(data.publishDate as string).getTime();
    if (Number.isFinite(time) && time > Date.now()) return false;
  }
  return true;
}

// Drops a whole "## Heading" section (up to the next "## " heading).
function removeSection(markdown: string, headingPattern: RegExp): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of markdown.split('\n')) {
    if (/^##\s/.test(line)) skipping = headingPattern.test(line);
    if (!skipping) out.push(line);
  }
  return out.join('\n');
}

function plainText(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Older articles have meta descriptions cut off with "...". Rebuild those from
// the first paragraph, ending on a full sentence.
function buildDescription(description: string, body: string): string {
  const given = (description || '').trim();
  if (given && !/(\.\.\.|…)$/.test(given)) return given;

  const firstParagraph = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|<|!|[-*]\s|\d+\.\s)/.test(p));
  const text = plainText(firstParagraph || given);
  if (text.length <= 158) return text;

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > 158) break;
    out += sentence;
  }
  out = out.trim();
  if (out.length >= 70) return out;

  const cut = text.slice(0, 155);
  return `${cut.slice(0, cut.lastIndexOf(' ')).trim()}…`;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(POSTS_DIRECTORY)) {
    return [];
  }
  const fileNames = fs.readdirSync(POSTS_DIRECTORY);
  const posts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      return getPostBySlug(slug);
    })
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const realSlug = slug.replace(/\.md$/, '');
    const fullPath = path.join(POSTS_DIRECTORY, `${realSlug}.md`);
    if (!fs.existsSync(fullPath)) return null;
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    if (!isLive(data)) return null;
    const readingTime = calculateReadingTime(content);

    // Remove the first image and its caption from content since the
    // hero image is already shown above the article body.
    const contentWithoutFirstImage = content
      .replace(/!\[[^\]]*\]\([^)]*\)\s*\n*\*?Photo:[^\n]*\n*/g, '')
      .replace(/\*Photo:[^\n]*via Unsplash[^\n]*\*\n*/gi, '')
      .replace(/Photo:[^\n]*via Unsplash[^\n]*\n*/gi, '');

    // The article page already shows related articles at the bottom, so the
    // hand-written "Related Articles" list inside the text is dropped.
    const cleanedMarkdown = removeSection(contentWithoutFirstImage, /^##\s+Related Articles\s*$/i);

    const contentHtml = md.render(cleanedMarkdown);
    const description = buildDescription(data.description || '', cleanedMarkdown);
    const tags: string[] = data.tags || [];

    return {
      slug: realSlug,
      title: data.title || '',
      description,
      excerpt: description,
      date: data.date || '',
      author: data.author || 'VetSphere Team',
      category: resolveCategory(data.category, data.title || '', tags),
      tags,
      image: data.image || '/images/placeholder.jpg',
      imageAlt: data.imageAlt || data.title,
      content: contentHtml,
      readingTime,
      readTime: `${readingTime} min read`,
      featured: data.featured || false,
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((post) => post.category.toLowerCase() === category.toLowerCase());
}

export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getFeaturedPosts(count: number = 3): BlogPost[] {
  return getAllPosts()
    .filter((post) => post.featured)
    .slice(0, count);
}

// Ranks other articles by shared specific tags (generic tags are ignored) and
// category, then recency, so related articles are about the same topic.
export function getRelatedPosts(slug: string, count: number = 3): BlogPost[] {
  const all = getAllPosts();
  const post = all.find((p) => p.slug === slug);
  if (!post) return [];

  const specific = (tags: string[]) =>
    tags.map((t) => t.toLowerCase()).filter((t) => !GENERIC_TAGS.has(t));
  const mine = new Set(specific(post.tags));

  return all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const shared = specific(p.tags).filter((t) => mine.has(t)).length;
      const sameCategory = p.category && p.category === post.category ? 1 : 0;
      return { p, score: shared * 2 + sameCategory };
    })
    .sort(
      (a, b) =>
        b.score - a.score || new Date(b.p.date).getTime() - new Date(a.p.date).getTime()
    )
    .slice(0, count)
    .map((x) => x.p);
}

export function getAdjacentPosts(slug: string): { prev: BlogPost | null; next: BlogPost | null } {
  const posts = getAllPosts();
  const currentIndex = posts.findIndex((p) => p.slug === slug);
  if (currentIndex === -1) return { prev: null, next: null };
  const next = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const prev = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  return { prev, next };
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPosts().forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export function getTagCloud(): { tag: string; count: number }[] {
  const tags: { [key: string]: number } = {};
  getAllPosts().forEach((post) => {
    post.tags.forEach((tag) => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });
  return Object.entries(tags)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}
