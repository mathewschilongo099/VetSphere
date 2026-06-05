export async function GET() {
  return Response.json({
    message: 'VetSphere Africa API',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      categories: '/api/categories',
      products: '/api/products',
      newsletter: '/api/newsletter',
      contact: '/api/contact',
    },
  });
}
