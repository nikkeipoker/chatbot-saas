/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chatbot-saas-server-xarf.onrender.com';

const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/webhook', destination: `${BACKEND_URL}/webhook` }
    ];
  }
};
module.exports = nextConfig;
