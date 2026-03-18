#!/usr/bin/env node
/**
 * Production server for Hostinger deployment
 * This file should be set as the "Application Startup File" in Hostinger
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Get port from environment or use 3000
const port = parseInt(process.env.PORT || '3000', 10);
const dev = false; // Always production
const hostname = '0.0.0.0'; // Listen on all interfaces for Hostinger

// Initialize Next.js app
const app = next({ 
  dev, 
  hostname, 
  port,
  customServer: true
});

const handle = app.getRequestHandler();

console.log('🚀 Starting Vibtrix production server...');
console.log(`   Environment: PRODUCTION`);
console.log(`   Port: ${port}`);
console.log(`   Hostname: ${hostname}`);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // Add caching headers for video chunks
      if (parsedUrl.pathname.match(/\/videos\/[^/]+\/[^/]+\/segment_\d+\.ts$/)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      } else if (parsedUrl.pathname.match(/\/videos\/[^/]+\/.*\.m3u8$/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
      
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  // Set timeouts for Hostinger
  server.timeout = 300000; // 5 minutes
  server.keepAliveTimeout = 310000; // 5 minutes + 10 seconds
  server.headersTimeout = 320000; // 5 minutes + 20 seconds
  
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Vibtrix Server Running');
    console.log('='.repeat(70));
    console.log(`   Local: http://${hostname}:${port}`);
    console.log(`   Ready to accept connections`);
    console.log('='.repeat(70) + '\n');
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, closing server gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
  
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});
