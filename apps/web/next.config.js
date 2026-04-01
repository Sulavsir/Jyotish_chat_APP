/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jyotish/shared', '@jyotish/ui'],

  // Standalone output for production deployment
  // Creates a minimal standalone build in .next/standalone
  output: 'standalone',

  // Image optimization configuration
  images: {
    // For Next.js 13+ use remotePatterns instead of domains
    remotePatterns: [
      // Development - localhost
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/uploads/**',
      },
      // Development - Local network IPs (for testing on mobile devices)
      {
        protocol: 'http',
        hostname: '**.local',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.*.*',
        pathname: '/uploads/**',
      },
      // Production - Your actual domains
      {
        protocol: 'https',
        hostname: 'jotishapi.autonomoustechnology.net',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'jotish.autonomoustechnology.net',
        pathname: '/uploads/**',
      },
      // Google profile photos (used by Google login)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
        pathname: '/**',
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
