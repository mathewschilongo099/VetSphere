import { getAllPosts } from '@/lib/blog';
import { generateArticleSchema } from '@/lib/seo';

export async function GET() {
  try {
    const posts = getAllPosts();
    const articles = posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      author: post.author,
      category: post.category,
      tags: post.tags,
      image: post.image,
      readingTime: post.readingTime,
      featured: post.featured,
      url: `/articles/${post.slug}`,
    }));

    return Response.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
