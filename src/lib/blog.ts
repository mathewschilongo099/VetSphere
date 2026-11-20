import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { BlogPost } from '@/types';
import { buildSummary } from '@/lib/excerpt';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

const POSTS_DIRECTORY = path.join(process.cwd(), 'src/content/articles');

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
    const readingTime = calculateReadingTime(content);

    // Remove the first image and its caption from content since the
    // hero image is already shown above the article body, which avoids
    // the duplicate image at the top of older articles.
    const cleaned = content
      // Remove markdown image followed by optional Photo: caption line
      .replace(/!\[[^\]]*\]\([^)]*\)\s*\n*\*?Photo:[^\n]*\n*/g, '')
      // Remove any remaining standalone Photo: ... via Unsplash lines
      .replace(/\*Photo:[^\n]*via Unsplash[^\n]*\*\n*/gi, '')
      .replace(/Photo:[^\n]*via Unsplash[^\n]*\n*/gi, '')
      // Older articles end with a plain-text "Related Articles" list that often
      // links to unrelated topics. The article page shows a proper related
      // section instead, so the in-body list is dropped.
      .replace(/\n##\s+Related Articles[\s\S]*?(?=\n##\s|$)/gi, '\n');

    const contentHtml = md.render(cleaned);

    // Older descriptions were cut off mid-sentence with "...". For those, build a
    // clean summary from the opening paragraph. Complete descriptions are kept.
    const rawDescription = String(data.description || '').trim();
    const wasCutOff = !rawDescription || /(\.{3}|…)\s*$/.test(rawDescription);
    const description = wasCutOff ? buildSummary(cleaned) : rawDescription;

    return {
      slug: realSlug,
      title: data.title || '',
      description,
      excerpt: description,
      date: data.date || '',
      author: data.author || 'VetSphere Team',
      category: data.category || '',
      tags: data.tags || [],
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

export function getRelatedPosts(slug: string, count: number = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return getAllPosts()
    .filter(
      (p) =>
        p.slug !== slug &&
        (p.category === post.category || p.tags.some((tag) => post.tags.includes(tag)))
    )
    .slice(0, count);
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
