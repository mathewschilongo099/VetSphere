import { CATEGORIES } from '@/lib/categories';
import { getAllPosts } from '@/lib/blog';

export async function GET() {
  try {
    const posts = getAllPosts();
    const categories = CATEGORIES.map((c) => ({
      ...c,
      count: posts.filter((p) => p.category === c.name).length,
    })).filter((c) => c.count > 0);

    return Response.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
