/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure SPA behavior with proper client-side navigation
  skipTrailingSlashRedirect: true,
  
  experimental: {
    // Enable staleTimes for faster navigation - IMPORTANT for instant page loads
    staleTimes: {
      dynamic: 600, // Cache dynamic pages for 10 minutes (increased for instant navigation)
      static: 1800, // Cache static pages for 30 minutes (increased for instant navigation)
    },
    // Optimize package imports for faster loading
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      'date-fns',
    ],
    // Enable server React optimization
    optimizeServerReact: true,
    // Disable PPR (keep this off for stability)
    ppr: false,
    // Enable server minification for smaller bundles
    serverMinification: true,
    // Disable ISR cache to save memory
    isrMemoryCacheSize: 0,
    // CRITICAL: Increase body size limit for API routes (not just Server Actions)
    // This is required for large file uploads through API routes
    serverComponentsExternalPackages: ['sharp', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@ffprobe-installer/ffprobe'],
  },
  
  // IMPORTANT: Allow large file uploads for video processing
  // This enables uploading videos up to 500MB via Server Actions
  serverActions: {
    bodySizeLimit: '500mb',
  },
  
  // AGGRESSIVE: Optimize webpack for faster builds
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Speed up development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Reduce file system checks
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
        aggregateTimeout: 300,
        poll: false,
      };
    }
    
    // CRITICAL: Exclude README and markdown files from webpack parsing
    // This fixes the ffprobe README.md parsing error
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.(md|txt)$/,
      type: 'asset/source',
    });
    
    // CRITICAL: Externalize ffprobe and ffmpeg installers for server-side
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@ffprobe-installer/ffprobe');
        config.externals.push('@ffmpeg-installer/ffmpeg');
      }
    }
    
    // Optimize module resolution
    config.resolve.symlinks = false;
    
    return config;
  },
  
  // Font optimization is now handled by Next.js automatically
  // optimizeFonts option removed as it's deprecated
  serverExternalPackages: ["@node-rs/argon2", "sharp"],
  images: {
    // OPTIMIZATION: Allow SVG images from dicebear
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization for local uploads directory
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
    ],
  },
  
  // AGGRESSIVE: Reduce overhead in development
  devIndicators: {
    buildActivity: false, // Disable build indicator for faster perception
    buildActivityPosition: 'bottom-right',
  },
  
  // AGGRESSIVE: Optimize production builds too
  compress: true,
  poweredByHeader: false,
  
  // AGGRESSIVE: Reduce memory usage
  onDemandEntries: {
    // Keep pages in memory longer
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5, // Keep 5 pages in memory
  },
  
  // CRITICAL: Custom headers for API routes to allow large uploads
  // AND cache HLS video chunks aggressively for smooth reel playback
  async headers() {
    return [
      {
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Cache HLS video chunks aggressively (for smooth reel navigation)
      {
        source: '/videos/:videoId/:quality/segment_:segment.ts',
        headers: [
          {
            key: 'Cache-Control',
            // Cache chunks for 7 days, allow stale content for 30 days
            // This enables instant playback when user scrolls back to previous reels
            value: 'public, max-age=604800, stale-while-revalidate=2592000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Cache HLS playlists for shorter duration (they might update)
      {
        source: '/videos/:videoId/:path*.m3u8',
        headers: [
          {
            key: 'Cache-Control',
            // Cache playlists for 1 hour, allow stale for 1 day
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Cache thumbnails aggressively
      {
        source: '/videos/:videoId/thumbnail.jpg',
        headers: [
          {
            key: 'Cache-Control',
            // Cache thumbnails for 7 days
            value: 'public, max-age=604800, stale-while-revalidate=2592000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
