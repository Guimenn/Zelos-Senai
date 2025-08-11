/** @type {import('next').NextConfig} */

const nextConfig = {
  rewrites: async () => {
    return [
      // Rotas de anexos
      {
        source: '/api/attachments/:path*',
        destination: 'http://localhost:3001/api/attachments/:path*',
      },
      // Rotas de usuário
      {
        source: '/user/:path*',
        destination: 'http://localhost:3001/user/:path*',
      },
      // Rotas de login e autenticação
      {
        source: '/login/:path*',
        destination: 'http://localhost:3001/login/:path*',
      },
      {
        source: '/login',
        destination: 'http://localhost:3001/login',
      },
      // Rotas de admin
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3001/admin/:path*',
      },
      // Rotas de helpdesk
      {
        source: '/helpdesk/:path*',
        destination: 'http://localhost:3001/helpdesk/:path*',
      },
      // Rotas de notificações
      {
        source: '/api/notifications/:path*',
        destination: 'http://localhost:3001/api/notifications/:path*',
      },
    ];
  },
};


module.exports = nextConfig;
