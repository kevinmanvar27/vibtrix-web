const http = require("http");
const httpProxy = require("http-proxy");

// Create a proxy server with improved configuration
const proxy = httpProxy.createProxyServer({
  // Set timeouts to prevent hanging connections
  proxyTimeout: 30000, // 30 seconds
  timeout: 30000, // 30 seconds
  // Keep connections alive
  keepAlive: true,
  // Automatically handle websocket connections
  ws: true,
});

// Handle proxy errors with improved error reporting
proxy.on("error", function (err, req, res) {
  console.error("Proxy error:", err);

  // Check if headers have already been sent
  if (!res.headersSent) {
    try {
      res.writeHead(502, {
        "Content-Type": "text/plain",
        "X-Proxy-Error": err.message,
      });
      res.end(
        `Proxy Error: The application server is not responding. Please try again later.\n\nDetails: ${err.message}`,
      );
    } catch (writeError) {
      console.error("Error sending proxy error response:", writeError);
    }
  } else {
    try {
      // Try to end the response if possible
      res.end();
    } catch (endError) {
      console.error("Error ending response after proxy error:", endError);
    }
  }
});

// Create the server
const server = http.createServer(function (req, res) {
  // Set request timeout
  req.setTimeout(60000); // 60 seconds

  // Log the request (only in development)
  if (process.env.NODE_ENV !== "production") {
    console.log(`Proxying request: ${req.method} ${req.url}`);
  }

  // Forward the request to port 3001
  proxy.web(req, res, {
    target: "http://localhost:3001",
  });
});

// Handle WebSocket connections
server.on("upgrade", function (req, socket, head) {
  proxy.ws(req, socket, head, {
    target: "http://localhost:3001",
  });
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(
      "Port 3000 is already in use. Please stop other services using this port.",
    );
    process.exit(1);
  }
});

// Log when server is ready
server.on("listening", () => {
  console.log(
    "Proxy server is now listening on port 3000, forwarding to port 3001",
  );
});

// Set server timeout
server.timeout = 120000; // 2 minutes

// Listen on port 3000
server.listen(3000);
