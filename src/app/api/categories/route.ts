import { CATEGORIES } from '@/lib/constants';

export async function GET() {
  try {
    return Response.json({
      success: true,
      count: CATEGORIES.length,
      categories: CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
