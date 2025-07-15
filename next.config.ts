import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: process.env.FIREBASE_HOSTING ? 'export' : 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow cross-origin requests from preview environments
  ...(process.env.NODE_ENV === 'development' && {
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
            },
          ],
        },
      ]
    },
  }),
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable source maps in dev to save memory
    productionBrowserSourceMaps: false,
    // Experimental features for better performance
    experimental: {
      optimizeCss: false,
    },
  }),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
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
    'firebase-admin',
    'handlebars',
    'dotprompt',
    'genkit',
    'bull'
  ],
  // Configure webpack for better memory management
  webpack: (config, { dev, isServer }) => {
    // Handle problematic packages
    if (isServer) {
      config.externals.push({
        'handlebars': 'handlebars',
        'dotprompt': 'dotprompt',
        '@genkit-ai/core': '@genkit-ai/core',
        'genkit': 'genkit'
      });
    }
    
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
