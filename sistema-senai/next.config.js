/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pyrxlymsoidmjxjenesb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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
      // Rotas de agentes
      {
        source: '/agent/:path*',
        destination: 'http://localhost:3001/agent/:path*',
      },
      // Rotas de notificações
      {
        source: '/api/notifications/:path*',
        destination: 'http://localhost:3001/api/notifications/:path*',
      },
      // Rotas de employees (corrigido)
      {
        source: '/pages/employees',
        destination: 'http://localhost:3001/user',
      },
      {
        source: '/pages/employees/:path*',
        destination: 'http://localhost:3001/user/:path*',
      },
      // Rotas de employees (alternativa)
      {
        source: '/employees/:path*',
        destination: 'http://localhost:3001/user/:path*',
      },
    ];
  },
};


module.exports = nextConfig;
