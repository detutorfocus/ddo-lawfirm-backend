/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  webpack(config) {
    // Mirror every tsconfig path alias so webpack resolves them too
    config.resolve.alias = {
      ...config.resolve.alias,
      '@':            path.resolve(__dirname, 'src'),
      '@/styles':     path.resolve(__dirname, 'styles'),
      '@/pages':      path.resolve(__dirname, 'pages'),
      '@/public':     path.resolve(__dirname, 'public'),
      '@/hooks':      path.resolve(__dirname, 'src/hooks'),
      '@/lib':        path.resolve(__dirname, 'src/lib'),
      '@/types':      path.resolve(__dirname, 'src/types'),
      '@/utils':      path.resolve(__dirname, 'src/utils'),
      '@/services':   path.resolve(__dirname, 'src/services'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/server':     path.resolve(__dirname, 'src/server'),
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: '/admin',  destination: '/admin/dashboard',  permanent: false },
      { source: '/portal', destination: '/client/dashboard', permanent: false },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },

  env: {
    NEXT_PUBLIC_APP_URL:   process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FIRM_NAME: 'D.D. Onietan (SAN) & Co.',
  },
};

module.exports = nextConfig;
