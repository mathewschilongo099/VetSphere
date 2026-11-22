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

// Styles for the tap-to-open FAQ rows. Written next to the FAQ so it works in
// light and dark mode without touching the site's stylesheets.
const FAQ_STYLE = `<style>
.faq-item{border:1px solid rgba(128,128,128,.35);border-radius:12px;margin:10px 0;background:rgba(128,128,128,.06)}
.faq-item[open]{background:rgba(22,163,74,.08);border-color:rgba(22,163,74,.5)}
.faq-item>summary{cursor:pointer;list-style:none;padding:14px 16px;font-weight:600;font-size:1rem;line-height:1.4;display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0}
.faq-item>summary::-webkit-details-marker{display:none}
.faq-item>summary::marker{content:""}
.faq-item>summary::after{content:"";width:8px;height:8px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);flex-shrink:0;margin-right:4px;transition:transform .2s}
.faq-item[open]>summary::after{transform:rotate(-135deg)}
.faq-answer{padding:0 16px 14px}
.faq-answer>p:first-child{margin-top:0}
.faq-answer>p:last-child{margin-bottom:0}
</style>`;

// Turns the "Frequently Asked Questions" section into tap-to-open rows: only
// the questions show, and tapping one opens its answer (no page load, built-in
// <details> element). Each "### Question" becomes a row; the text under it is
// the answer. Articles without an FAQ section render as before.
function renderWithFaq(markdown: string): string {
  const lines = markdown.split('\n');
  const start = lines.findIndex(
    (l) => /^##\s/.test(l) && /(frequently asked questions|\bfaqs?\b)/i.test(l)
  );
  if (start === -1) return md.render(markdown);

  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end === -1) end = lines.length;

  const faqLines = lines.slice(start + 1, end);
  const firstQuestion = faqLines.findIndex((l) => /^###\s/.test(l));
  if (firstQuestion === -1) return md.render(markdown);

  const intro = faqLines.slice(0, firstQuestion).join('\n');
  const items: { question: string; answer: string[] }[] = [];
  for (const line of faqLines.slice(firstQuestion)) {
    const q = line.match(/^###\s+(.*)$/);
    if (q) items.push({ question: q[1].trim(), answer: [] });
    else items[items.length - 1].answer.push(line);
  }

  const rows = items
    .map(
      (item) =>
        `<details class="faq-item"><summary>${md.renderInline(item.question)}</summary><div class="faq-answer">${md.render(
          item.answer.join('\n').trim()
        )}</div></details>`
    )
    .join('\n');

  return [
    md.render(lines.slice(0, start).join('\n')),
    md.render(lines[start]),
    intro.trim() ? md.render(intro) : '',
    FAQ_STYLE,
    rows,
    md.render(lines.slice(end).join('\n')),
  ].join('\n');
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
    // The "Sources" list is hidden too: VetSphere reads like a blog, not a
    // research paper. The section stays in the .md file, it is just not shown.
    const cleanedMarkdown = removeSection(
      removeSection(contentWithoutFirstImage, /^##\s+Related Articles\s*$/i),
      /^##\s+(Sources|References)\s*$/i
    );

    const contentHtml = renderWithFaq(cleanedMarkdown);
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
