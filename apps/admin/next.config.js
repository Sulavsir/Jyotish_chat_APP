/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jyotish/shared', '@jyotish/ui'],
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig



