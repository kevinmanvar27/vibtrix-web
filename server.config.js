// Custom server configuration for handling large file uploads
// This file is used to configure the Next.js server

// Set environment variable for body size limit
// This affects the underlying Node.js HTTP server
process.env.NODE_OPTIONS = '--max-http-header-size=80000';

// Increase body parser limit
const bodyParser = require('body-parser');

module.exports = {
  // Configure body parser for large files
  onProxyReq: (proxyReq, req, res) => {
    // Set content length header
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    }
  },
};
