/**
 * Enhanced Upload Diagnostics
 * 
 * This script monitors the upload endpoint and provides detailed diagnostics
 * to help identify where the 500 error is occurring.
 */

import http from 'http';

const SERVER_URL = 'localhost';
const SERVER_PORT = 3000;

console.log('\n' + '='.repeat(70));
console.log('Upload Endpoint Diagnostics');
console.log('='.repeat(70) + '\n');

console.log('Testing connection to upload endpoint...\n');

// Test 1: Basic connectivity
console.log('Test 1: Checking server connectivity...');
const testRequest = http.request({
  hostname: SERVER_URL,
  port: SERVER_PORT,
  path: '/api/upload',
  method: 'GET', // Use GET to test endpoint existence
}, (res) => {
  console.log(`✅ Server responded with status: ${res.statusCode}`);
  console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   Response: ${data.substring(0, 200)}...\n`);
    
    // Test 2: Check if it's returning HTML or JSON
    console.log('Test 2: Checking response format...');
    if (res.headers['content-type']?.includes('application/json')) {
      console.log('✅ Server returns JSON (correct)\n');
    } else if (res.headers['content-type']?.includes('text/html')) {
      console.log('⚠️  Server returns HTML (might indicate error page)\n');
    } else {
      console.log(`⚠️  Server returns: ${res.headers['content-type']}\n`);
    }
    
    // Test 3: Server configuration
    console.log('Test 3: Server configuration...');
    console.log(`   Server: ${res.headers['server'] || 'Unknown'}`);
    console.log(`   X-Powered-By: ${res.headers['x-powered-by'] || 'Not set'}`);
    console.log(`   Connection: ${res.headers['connection']}`);
    console.log(`   Keep-Alive: ${res.headers['keep-alive'] || 'Not set'}\n`);
    
    console.log('='.repeat(70));
    console.log('Diagnostics Complete');
    console.log('='.repeat(70) + '\n');
    
    console.log('Next Steps:');
    console.log('1. If server returns JSON → Configuration is correct');
    console.log('2. If server returns HTML → Check if custom server is running');
    console.log('3. Try uploading from Flutter app and monitor server logs\n');
  });
});

testRequest.on('error', (error) => {
  console.error('❌ Error connecting to server:', error.message);
  console.error('\nPossible causes:');
  console.error('1. Server is not running (run: npm run dev)');
  console.error('2. Server is running on a different port');
  console.error('3. Firewall is blocking the connection\n');
  process.exit(1);
});

testRequest.end();
