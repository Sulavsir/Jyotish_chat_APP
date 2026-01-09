/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jyotish/shared', '@jyotish/ui'],
  images: {
    domains: ['localhost', '192.168.0.206'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.206',
      },
      {
        protocol: 'http',
        hostname: '**.local',
      },
    ],
  },
  // Proxy API requests to backend to avoid CORS/cookie issues in development
  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

