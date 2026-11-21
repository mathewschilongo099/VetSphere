/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '*.pexels.com' },
      { protocol: 'https', hostname: '*.unsplash.com' },
    ],
  },
  compress: true,
  poweredByHeader: false,

  async redirects() {
    return [
      // Permanently redirect the old Vercel domain to the new domain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vet-sphere.vercel.app' }],
        destination: 'https://vetsphere.cc.cd/:path*',
        permanent: true,
      },
      // The generic Services page was merged into About
      { source: '/services', destination: '/about', permanent: true },
    ];
  },
};

export default nextConfig;
