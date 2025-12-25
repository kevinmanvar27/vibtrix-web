#!/bin/bash

# Set environment to production
export NODE_ENV=production

# Clean the .next directory
echo "Cleaning .next directory..."
rm -rf .next

# Run the Next.js build
echo "Building Next.js application..."
next build

# Run JavaScript optimization
echo "Optimizing JavaScript..."
node scripts/optimize-js.js

# Run media optimization
echo "Optimizing media (images and videos)..."
node scripts/optimize-media.js

# Start the server
echo "Starting server on port 3000..."
next start -p 3000
