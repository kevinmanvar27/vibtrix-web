#!/bin/bash

# Script to run the application in production mode with all logs suppressed
# This script sets environment variables to minimize console output
# 
# Usage: ./scripts/run-production-mode.sh

# Set environment variables to suppress logs
export NODE_ENV=production
export PRISMA_LOG_QUERIES=false
export NEXT_TELEMETRY_DISABLED=1
export REACT_DEVTOOLS_GLOBAL_HOOK=false
export REACT_QUERY_DEVTOOLS=false
export LOG_LEVEL=error
export DEBUG=false
export NEXT_WEBPACK_DISABLE_PERFORMANCE_HINTS=1
export NEXT_DISABLE_BUILD_INDICATOR=1
export NEXT_DISABLE_SERVER_LOGS=1
export PRISMA_CLIENT_NO_LOGS=1
export NODE_OPTIONS="--no-warnings"

# Run the Prisma log suppression script
node scripts/suppress-prisma-logs.js

# Build the application in production mode
echo "Building the application in production mode..."
next build

# Start the application in production mode
echo "Starting the application in production mode with all logs suppressed..."
next start -p 3000
