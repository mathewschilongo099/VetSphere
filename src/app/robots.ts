export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private pages and API routes should never appear in search results.
        disallow: ['/admin', '/api/', '/generate'],
      },
    ],
    sitemap: 'https://vetsphere.cc.cd/sitemap.xml',
    host: 'https://vetsphere.cc.cd',
  };
}
