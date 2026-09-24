/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '*.pexels.com',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,

  // Permanently (301) redirect the old Vercel domain to the new domain
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vet-sphere.vercel.app' }],
        destination: 'https://vetsphere.cc.cd/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
