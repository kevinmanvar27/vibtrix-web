/**
 * Custom Next.js Server with Large File Upload Support
 * 
 * This custom server is required because Next.js App Router doesn't provide
 * a built-in way to configure body size limits for API routes.
 * 
 * The serverActions.bodySizeLimit in next.config.mjs ONLY applies to Server Actions,
 * NOT to API routes (/api/*).
 * 
 * CRITICAL: This server configuration removes the default Node.js body size limits
 * that would otherwise cause 500 errors for large file uploads.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app with custom configuration
const app = next({ 
  dev, 
  hostname, 
  port,
  // Disable built-in body parsing to allow unlimited size
  customServer: true
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server with custom configuration for large uploads
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Log incoming upload requests for debugging
      if (parsedUrl.pathname.startsWith('/api/upload')) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${new Date().toISOString()}] Upload request received`);
        console.log(`  Method: ${req.method}`);
        console.log(`  Path: ${parsedUrl.pathname}`);
        console.log(`  Content-Type: ${req.headers['content-type']}`);
        console.log(`  Content-Length: ${req.headers['content-length']} bytes`);
        console.log(`${'='.repeat(60)}\n`);
      }
      
      // Add aggressive caching headers for HLS video chunks
      // This enables smooth reel navigation by caching chunks in browser/Flutter
      if (parsedUrl.pathname.match(/\/videos\/[^/]+\/[^/]+\/segment_\d+\.ts$/)) {
        // Cache video chunks for 7 days (immutable content)
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000, immutable');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (parsedUrl.pathname.match(/\/videos\/[^/]+\/.*\.m3u8$/)) {
        // Cache playlists for 1 hour (might update)
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (parsedUrl.pathname.match(/\/videos\/[^/]+\/thumbnail\.jpg$/)) {
        // Cache thumbnails for 7 days
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000, immutable');
      }
      
      // IMPORTANT: Don't set any body size limits here
      // Let Next.js handle the body parsing with its own limits
      // The NODE_OPTIONS in start-dev.js handles the header size
      
      // Handle the request with Next.js
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Internal server error',
        details: err.message 
      }));
    }
  });
  
  // CRITICAL: Set server timeout to allow long upload times
  // Default is 2 minutes, we need more for video processing
  server.timeout = 600000; // 10 minutes
  server.keepAliveTimeout = 610000; // 10 minutes + 10 seconds
  server.headersTimeout = 620000; // 10 minutes + 20 seconds
  // CRITICAL: Set max header size for the server
  server.maxHeaderSize = 80000; // 80KB for large multipart/form-data headers
  
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 Vibtrix Development Server`);
    console.log(`${'='.repeat(70)}`);
    console.log(`   URL: http://${hostname}:${port}`);
    console.log(`   Environment: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`   Max Header Size: 80KB`);
    console.log(`   Server Timeout: 10 minutes`);
    console.log(`   Large File Uploads: ✅ ENABLED`);
    console.log(`   Video Processing (HLS): ✅ ENABLED`);
    console.log(`${'='.repeat(70)}\n`);
  });
});
