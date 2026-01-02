#!/usr/bin/env node
/**
 * Smart dev server starter - finds available port automatically
 */

const { spawn, execSync } = require('child_process');
const net = require('net');

const PREFERRED_PORTS = [3000, 3001, 3002, 3003, 3004];

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function killProcessOnPort(port) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, { stdio: 'ignore' });
    // Wait a bit for port to be released
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch {
    return false;
  }
}

async function findAvailablePort() {
  for (const port of PREFERRED_PORTS) {
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} is in use, trying next...`);
  }
  
  // If all preferred ports are busy, try to kill process on 3000
  console.log('All preferred ports busy. Attempting to free port 3000...');
  await killProcessOnPort(3000);
  
  if (await isPortAvailable(3000)) {
    return 3000;
  }
  
  throw new Error('No available ports found. Please manually close applications using ports 3000-3004.');
}

async function main() {
  try {
    const port = await findAvailablePort();
    console.log(`\n🚀 Starting development server on port ${port}...\n`);
    
    const nextDev = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env }
    });

    nextDev.on('error', (err) => {
      console.error('Failed to start dev server:', err);
      process.exit(1);
    });

    nextDev.on('close', (code) => {
      process.exit(code || 0);
    });

    // Handle termination signals
    process.on('SIGINT', () => {
      nextDev.kill('SIGINT');
    });
    process.on('SIGTERM', () => {
      nextDev.kill('SIGTERM');
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
