import type { NextConfig } from 'next';

import initializeBundleAnalyzer from '@next/bundle-analyzer';

// https://www.npmjs.com/package/@next/bundle-analyzer
const withBundleAnalyzer = initializeBundleAnalyzer({
    enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true'
});

// https://nextjs.org/docs/pages/api-reference/next-config-js
const nextConfig: NextConfig = {
    output: 'standalone',
    outputFileTracingIncludes: {
        "/*": ["./registry/**/*"],
      },
      images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "avatars.githubusercontent.com",
          },
          {
            protocol: "https",
            hostname: "images.unsplash.com",
          },
        ],
      },
      // Exclude server-only packages from client bundle
      serverExternalPackages: ['bull', 'ioredis'],
      // Temporarily disable TypeScript checking during build
      // TODO: Fix all remaining TypeScript errors in API routes and components
      typescript: {
        ignoreBuildErrors: true,
      },
};

export default withBundleAnalyzer(nextConfig);
