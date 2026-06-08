export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://vet-sphere.vercel.app/sitemap.xml',
  };
}
