/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure SPA behavior with proper client-side navigation
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  // Enable strict mode in development for better error detection
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // Disable console output in production
  onDemandEntries: {
    // Keep error pages in memory
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Suppress webpack logs
    pagesBufferLength: 2,
  },

  experimental: {
    // Disable most experimental features to improve stability
    staleTimes: {
      dynamic: 30,
    },
    // Disable package imports optimization
    optimizePackageImports: [],
    // Disable server React optimization
    optimizeServerReact: false,
    // Disable PPR
    ppr: false,
    // Disable server minification
    serverMinification: false,
  },
  // Optimize fonts
  optimizeFonts: true,
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
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://*.gstatic.com https://*.googleapis.com https://www.googletagmanager.com; connect-src 'self' https://*.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebase.googleapis.com wss://*.firebaseio.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.gstatic.com https://*.googleapis.com https://utfs.io https://api.dicebear.com https://api.qrserver.com; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://*.razorpay.com https://*.youtube.com https://*.google.com https://*.firebase.com https://*.firebaseapp.com; worker-src 'self' blob:;",
          },
        ],
      },
    ];
  },

  // Configure webpack with minimal optimizations for stability
  webpack: (config, { dev, isServer }) => {
    // Only apply minimal optimizations in production
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
                // Disable advanced optimizations
                passes: 1,
                reduce_vars: false,
                collapse_vars: false,
                inline: false,
                dead_code: true,
                drop_console: true, // Remove console.* calls
                drop_debugger: true, // Remove debugger statements
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

      // Use simpler chunk splitting
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 10,
        minSize: 50000,
        cacheGroups: {
          framework: {
            name: "framework",
            test: /[\\/]node_modules[\\/](@react|react|react-dom|next|@next)[\\/]/,
            priority: 40,
            chunks: "all",
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
            priority: 30
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
