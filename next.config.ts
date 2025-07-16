import type {NextConfig} from 'next';
import { withSentryConfig } from '@sentry/nextjs';

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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  
  // Organization and project from your Sentry project settings
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token from your Sentry account
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Disable source maps upload in development
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  
  // Hide source maps from generated client bundles
  hideSourceMaps: true,
  
  // Configure the server-side release directory
  include: '.next',
  
  // Ignore specific files/directories
  ignore: ['node_modules', '.next/cache'],
  
  // URL prefix for source maps
  urlPrefix: '~/_next/',
  
  // Additional webpack configuration
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Don't upload source maps in development
    if (process.env.NODE_ENV === 'development') {
      return config;
    }
    
    return config;
  },
};

// Export the config with Sentry integration
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
