#!/usr/bin/env node
/**
 * Smart production server starter - finds available port automatically
 * Uses standalone build for better performance
 */

const { spawn, execSync } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');

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
    
    // Check if standalone build exists
    const standaloneServerPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');
    const useStandalone = fs.existsSync(standaloneServerPath);
    
    if (useStandalone) {
      console.log(`\n🚀 Starting standalone production server on port ${port}...\n`);
      
      const server = spawn('node', [standaloneServerPath], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { 
          ...process.env,
          PORT: port.toString(),
          HOSTNAME: '0.0.0.0'
        }
      });

      server.on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
      });

      server.on('close', (code) => {
        process.exit(code || 0);
      });

      process.on('SIGINT', () => server.kill('SIGINT'));
      process.on('SIGTERM', () => server.kill('SIGTERM'));
      
    } else {
      console.log(`\n🚀 Starting production server on port ${port}...\n`);
      console.log('(Note: For better performance, run "npm run build" first to create standalone build)\n');
      
      const nextStart = spawn('npx', ['next', 'start', '-p', port.toString()], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env }
      });

      nextStart.on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
      });

      nextStart.on('close', (code) => {
        process.exit(code || 0);
      });

      process.on('SIGINT', () => nextStart.kill('SIGINT'));
      process.on('SIGTERM', () => nextStart.kill('SIGTERM'));
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
