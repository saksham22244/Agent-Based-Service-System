/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    turbopackUseSystemTlsCerts: true,
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
};

module.exports = nextConfig;
