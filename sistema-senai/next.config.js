/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configurações para produção
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['@heroui/react', 'react-icons', 'framer-motion'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    optimizeCss: true,
    webpackBuildWorker: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    optimizeServerReact: true,
  },
  
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
    const isDevelopment = process.env.NODE_ENV === 'development';
    const apiUrl = isDevelopment ? 'http://localhost:3001' : 'https://zelos-senai.onrender.com';
    
    return [
      // Rotas de anexos
      {
        source: '/api/attachments/:path*',
        destination: `${apiUrl}/api/attachments/:path*`,
      },
      // Rotas de usuário
      {
        source: '/user/:path*',
        destination: `${apiUrl}/user/:path*`,
      },
      // Rotas de login e autenticação
      {
        source: '/login/:path*',
        destination: `${apiUrl}/login/:path*`,
      },
      {
        source: '/login',
        destination: `${apiUrl}/login`,
      },
      // Rota de logout
      {
        source: '/logout',
        destination: `${apiUrl}/login/logout`,
      },
      // Rotas de admin
      {
        source: '/admin/:path*',
        destination: `${apiUrl}/admin/:path*`,
      },
      // Rotas de helpdesk
      {
        source: '/helpdesk/:path*',
        destination: `${apiUrl}/helpdesk/:path*`,
      },
      // Rotas de agentes
      {
        source: '/agent/:path*',
        destination: `${apiUrl}/agent/:path*`,
      },
      // Rotas de notificações
      {
        source: '/api/notifications/:path*',
        destination: `${apiUrl}/api/notifications/:path*`,
      },
      // Rotas de employees (corrigido)
      {
        source: '/pages/employees',
        destination: `${apiUrl}/user`,
      },
      {
        source: '/pages/employees/:path*',
        destination: `${apiUrl}/user/:path*`,
      },
      // Rotas de employees (alternativa)
      {
        source: '/employees/:path*',
        destination: `${apiUrl}/user/:path*`,
      },
    ];
  },
};


module.exports = nextConfig;
