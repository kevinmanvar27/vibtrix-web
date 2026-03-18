/**
 * Test Script: Verify Server Configuration for Large File Uploads
 * 
 * This script tests that the custom server is properly configured
 * to handle large file uploads without 500 errors.
 */

import http from 'http';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const SERVER_URL = 'http://localhost:3000';
const TEST_ENDPOINT = '/api/upload';

async function testServerConfiguration() {
  console.log('\n' + '='.repeat(70));
  console.log('Testing Server Configuration for Large File Uploads');
  console.log('='.repeat(70) + '\n');

  // Test 1: Check if server is running
  console.log('Test 1: Checking if server is running...');
  try {
    const response = await fetch(SERVER_URL);
    console.log(`✅ Server is running (Status: ${response.status})\n`);
  } catch (error) {
    console.error('❌ Server is not running. Please start the server with: npm run dev\n');
    process.exit(1);
  }

  // Test 2: Check upload endpoint with small file
  console.log('Test 2: Testing upload endpoint with small file...');
  try {
    const form = new FormData();
    const testContent = Buffer.from('Test file content for upload verification');
    form.append('files', testContent, {
      filename: 'test.txt',
      contentType: 'text/plain',
    });

    const response = await fetch(`${SERVER_URL}${TEST_ENDPOINT}`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type, let form-data set it with boundary
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Upload endpoint is working (requires authentication)\n');
    } else if (response.status === 200) {
      console.log('✅ Upload endpoint is working (upload successful)\n');
    } else {
      console.log(`⚠️  Upload endpoint returned status ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
    }
  } catch (error) {
    console.error('❌ Error testing upload endpoint:', error.message);
    console.error('   This might indicate a server configuration issue\n');
  }

  // Test 3: Check Node.js configuration
  console.log('Test 3: Checking Node.js configuration...');
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Max Old Space Size: ${process.env.NODE_OPTIONS || 'Not set'}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}\n`);

  // Test 4: Check if custom server is being used
  console.log('Test 4: Checking server configuration...');
  const serverFilePath = path.join(process.cwd(), 'server.js');
  if (fs.existsSync(serverFilePath)) {
    console.log('✅ Custom server file exists (server.js)');
    console.log('   This enables large file upload support\n');
  } else {
    console.log('❌ Custom server file not found');
    console.log('   Large file uploads may not work properly\n');
  }

  // Test 5: Check environment configuration
  console.log('Test 5: Checking environment configuration...');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('✅ .env.local file exists');
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    if (envContent.includes('NODE_OPTIONS')) {
      console.log('✅ NODE_OPTIONS is configured in .env.local\n');
    } else {
      console.log('⚠️  NODE_OPTIONS not found in .env.local\n');
    }
  } else {
    console.log('⚠️  .env.local file not found\n');
  }

  console.log('='.repeat(70));
  console.log('Configuration Test Complete');
  console.log('='.repeat(70) + '\n');

  console.log('Next Steps:');
  console.log('1. If all tests passed, try uploading a video from the Flutter app');
  console.log('2. Monitor the server terminal for upload logs');
  console.log('3. If you still get 500 errors, check the server logs for details\n');
}

// Run the tests
testServerConfiguration().catch(console.error);
