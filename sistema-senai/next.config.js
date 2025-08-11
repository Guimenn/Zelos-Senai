/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/attachments/:path*',
        destination: 'http://localhost:3001/api/attachments/:path*',
      },
      {
        source: '/user/:path*',
        destination: 'http://localhost:3001/user/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
