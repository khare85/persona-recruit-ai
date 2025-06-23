/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: [
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
      'cdn.your-domain.com', // Replace with your CDN domain
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), location=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for security
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Production-specific optimizations
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    // Ignore client-side packages in server builds
    if (isServer) {
      config.externals.push({
        '@google-cloud/storage': 'commonjs @google-cloud/storage',
      });
    }

    // Bundle analyzer (optional)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    serverMinification: true,
    serverSourceMaps: false,
    gzipSize: true,
  },

  // Output configuration
  output: 'standalone',
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,

  // TypeScript configuration
  typescript: {
    // Ignore build errors in production (handled by CI/CD)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },

  // Trailing slash configuration
  trailingSlash: false,

  // API route timeout and limits
  serverRuntimeConfig: {
    apiTimeout: 30000, // 30 seconds
    maxRequestSize: '5mb',
  },

  // API configuration
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
    responseLimit: '5mb',
    externalResolver: true,
  },

  // Public runtime config
  publicRuntimeConfig: {
    version: process.env.npm_package_version || '1.0.0',
    buildTime: new Date().toISOString(),
  },
};

module.exports = nextConfig;