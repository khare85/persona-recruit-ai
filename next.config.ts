import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Since we're using Turbopack, configure it properly
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  // Optimization for production builds
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Instrumentation is enabled by default in Next.js 15
};

export default nextConfig;
