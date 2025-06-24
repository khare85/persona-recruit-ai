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
  // Optimization for production builds
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // External packages for server components
  serverExternalPackages: [
    '@google-cloud/documentai',
    '@google-cloud/storage',
    'firebase-admin'
  ],
  // Configure webpack for better memory management
  webpack: (config, { dev, isServer }) => {
    // Development optimizations for memory usage
    if (dev) {
      config.optimization.minimize = false;
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      };
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
          enforce: true
        }
      };
    }
    return config;
  },
  // Instrumentation is enabled by default in Next.js 15
};

export default nextConfig;
