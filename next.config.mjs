/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure SPA behavior with proper client-side navigation
  skipTrailingSlashRedirect: true,
  
  experimental: {
    // Enable staleTimes for faster navigation - IMPORTANT for instant page loads
    staleTimes: {
      dynamic: 60, // Cache dynamic pages for 60 seconds
      static: 180, // Cache static pages for 3 minutes
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
  },
  // Font optimization is now handled by Next.js automatically
  // optimizeFonts option removed as it's deprecated
  serverExternalPackages: ["@node-rs/argon2", "sharp"],
  images: {
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Enable image optimization for better performance
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    formats: ["image/webp", "image/avif"],
    // Improve image loading performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Configure static file serving for uploaded files
  output: "standalone",
  // Enable compression for better performance
  compress: true,

  // Add Content Security Policy headers for Firebase
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.gstatic.com https://*.googleapis.com https://www.googletagmanager.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebase.googleapis.com wss://*.firebaseio.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.gstatic.com https://*.googleapis.com https://utfs.io https://api.dicebear.com https://api.qrserver.com https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com https://*.youtube.com https://*.google.com https://*.firebase.com https://*.firebaseapp.com; worker-src 'self' blob:;",
          },
          // Add caching headers for faster subsequent loads
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache images
      {
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },

  // Configure webpack with optimizations for faster loading
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // Keep class names and function names
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach(minimizer => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              keep_classnames: true,
              keep_fnames: true,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                passes: 2, // More optimization passes
                reduce_vars: true,
                collapse_vars: true,
                inline: 2,
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
              },
              mangle: {
                ...minimizer.options.terserOptions?.mangle,
                keep_fnames: true,
                properties: false
              }
            };
          }
        });
      }

      // Optimized chunk splitting for faster initial load
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 244000, // Split large chunks for parallel loading
        cacheGroups: {
          // Framework chunks - loaded first
          framework: {
            name: "framework",
            test: /[\\/]node_modules[\\/](react|react-dom|next|@next)[\\/]/,
            priority: 50,
            chunks: "all",
            enforce: true,
          },
          // UI library chunks
          ui: {
            name: "ui",
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            priority: 45,
            chunks: "all",
          },
          // Query and state management
          query: {
            name: "query",
            test: /[\\/]node_modules[\\/](@tanstack)[\\/]/,
            priority: 40,
            chunks: "all",
          },
          // Other vendor chunks
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
            priority: 30
          },
          // Common components used across pages
          common: {
            name: "common",
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          }
        }
      };
    }
    return config;
  },
  rewrites: () => {
    return [
      {
        source: "/hashtag/:tag",
        destination: "/search?q=%23:tag",
      },
      // Handle Google OAuth callback from port 3000 to 3001
      {
        source: "/api/auth/callback/google",
        destination: "/api/auth/callback/google",
      },
    ];
  },
  // Transpile TipTap modules and other problematic packages
  transpilePackages: [
    "@tiptap/react",
    "@tiptap/pm",
    "@tiptap/starter-kit",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-image",
    "@tiptap/extension-link",
    "next-themes",
    "@tanstack/react-query",
    "@tanstack/react-query-devtools",
  ],
};

export default nextConfig;
