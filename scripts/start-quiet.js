#!/usr/bin/env node

/**
 * Script to start the Next.js application with suppressed logs
 * This script sets environment variables to minimize console output
 * 
 * Usage: node scripts/start-quiet.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Environment variables to suppress logs
const quietEnv = {
  ...process.env,
  // Disable Prisma query logging
  PRISMA_LOG_QUERIES: 'false',
  // Disable Next.js telemetry
  NEXT_TELEMETRY_DISABLED: '1',
  // Disable React DevTools
  REACT_DEVTOOLS_GLOBAL_HOOK: 'false',
  // Disable React Query DevTools
  REACT_QUERY_DEVTOOLS: 'false',
  // Set log level to minimal
  LOG_LEVEL: 'error',
  // Disable debug output
  DEBUG: 'false',
  // Disable webpack performance hints
  NEXT_WEBPACK_DISABLE_PERFORMANCE_HINTS: '1',
  // Disable Next.js build indicator
  NEXT_DISABLE_BUILD_INDICATOR: '1',
  // Disable Next.js server logs
  NEXT_DISABLE_SERVER_LOGS: '1',
  // Disable Prisma logs
  PRISMA_CLIENT_NO_LOGS: '1',
  // Disable Next.js logs
  NODE_OPTIONS: '--no-warnings',
};

// Command to run
const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', 'dev'];

console.log('Starting Next.js with suppressed logs...');

// Spawn the process with the quiet environment
const child = spawn(command, args, {
  env: quietEnv,
  stdio: 'inherit',
  cwd: process.cwd(),
});

// Handle process events
child.on('error', (error) => {
  console.error(`Error starting Next.js: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Next.js exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
