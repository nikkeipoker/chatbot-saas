/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' },
      { source: '/webhook', destination: 'http://localhost:3001/webhook' }
    ];
  }
};
module.exports = nextConfig;
