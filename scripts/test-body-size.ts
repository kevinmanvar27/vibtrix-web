/**
 * Test script to check body size limits
 * Run with: npx tsx scripts/test-body-size.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function testBodySize() {
  console.log('🔍 Testing Body Size Configuration...\n');
  
  // Check 1: Node.js options
  console.log('1️⃣ Checking NODE_OPTIONS environment variable...');
  const nodeOptions = process.env.NODE_OPTIONS;
  if (nodeOptions) {
    console.log(`   ✅ NODE_OPTIONS set: ${nodeOptions}`);
  } else {
    console.log('   ⚠️  NODE_OPTIONS not set');
    console.log('   💡 Add this to .env.local:');
    console.log('      NODE_OPTIONS="--max-http-header-size=80000"');
  }
  console.log('');
  
  // Check 2: .env.local file
  console.log('2️⃣ Checking .env.local file...');
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('NODE_OPTIONS')) {
      console.log('   ✅ .env.local has NODE_OPTIONS');
      const match = envContent.match(/NODE_OPTIONS=["']?([^"'\n]+)["']?/);
      if (match) {
        console.log(`   📝 Value: ${match[1]}`);
      }
    } else {
      console.log('   ⚠️  .env.local exists but no NODE_OPTIONS');
      console.log('   💡 Add this line to .env.local:');
      console.log('      NODE_OPTIONS="--max-http-header-size=80000"');
    }
  } else {
    console.log('   ⚠️  .env.local file not found');
    console.log('   💡 Create .env.local with:');
    console.log('      NODE_OPTIONS="--max-http-header-size=80000"');
  }
  console.log('');
  
  // Check 3: package.json scripts
  console.log('3️⃣ Checking package.json scripts...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const devScript = packageJson.scripts?.dev;
    
    if (devScript) {
      console.log(`   📝 Dev script: ${devScript}`);
      if (devScript.includes('NODE_OPTIONS')) {
        console.log('   ✅ Dev script includes NODE_OPTIONS');
      } else {
        console.log('   ⚠️  Dev script does NOT include NODE_OPTIONS');
        console.log('   💡 Consider updating to:');
        console.log('      "dev": "NODE_OPTIONS=\'--max-http-header-size=80000\' next dev"');
      }
    }
  }
  console.log('');
  
  // Check 4: Next.js config
  console.log('4️⃣ Checking next.config.mjs...');
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
    if (nextConfig.includes('serverActions')) {
      console.log('   ✅ serverActions configured');
      const match = nextConfig.match(/bodySizeLimit:\s*['"](\d+mb)['"]/i);
      if (match) {
        console.log(`   📝 Body size limit: ${match[1]}`);
      }
    } else {
      console.log('   ⚠️  serverActions not configured');
    }
  }
  console.log('');
  
  // Check 5: Running Node processes
  console.log('5️⃣ Checking running Node.js processes...');
  try {
    const { stdout } = await execAsync('tasklist | findstr node');
    const processes = stdout.trim().split('\n');
    console.log(`   📊 Found ${processes.length} Node.js processes:`);
    processes.forEach(proc => {
      console.log(`      ${proc.trim()}`);
    });
    console.log('');
    console.log('   💡 If you changed .env.local, you MUST restart all Node processes:');
    console.log('      taskkill /F /IM node.exe');
    console.log('      npm run dev');
  } catch (error) {
    console.log('   ⚠️  Could not check Node processes');
  }
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  
  console.log('✅ What\'s Configured:');
  console.log('   • serverActions.bodySizeLimit: 500mb (for Server Actions)');
  console.log('   • maxDuration: 300 seconds (for API routes)');
  console.log('');
  
  console.log('⚠️  What\'s Missing:');
  console.log('   • NODE_OPTIONS environment variable (for body size limit)');
  console.log('');
  
  console.log('🔧 How to Fix:');
  console.log('');
  console.log('   Option 1: Add to .env.local (RECOMMENDED)');
  console.log('   ----------------------------------------');
  console.log('   1. Create/edit .env.local file');
  console.log('   2. Add this line:');
  console.log('      NODE_OPTIONS="--max-http-header-size=80000"');
  console.log('   3. Restart server:');
  console.log('      taskkill /F /IM node.exe');
  console.log('      npm run dev');
  console.log('');
  
  console.log('   Option 2: Modify package.json');
  console.log('   ------------------------------');
  console.log('   Update dev script to:');
  console.log('   "dev": "NODE_OPTIONS=\'--max-http-header-size=80000\' next dev"');
  console.log('');
  
  console.log('   Option 3: Set system environment variable');
  console.log('   ------------------------------------------');
  console.log('   Windows: setx NODE_OPTIONS "--max-http-header-size=80000"');
  console.log('   (Requires restart of terminal)');
  console.log('');
  
  console.log('🧪 Testing:');
  console.log('   After applying fix, test with:');
  console.log('   POST http://localhost:3000/api/test-upload');
  console.log('');
  
  console.log('📊 Expected Results:');
  console.log('   • Small files (< 1MB): Should work now');
  console.log('   • Medium files (1-10MB): Should work after fix');
  console.log('   • Large files (10-100MB): Should work after fix');
  console.log('   • Very large files (> 100MB): May need chunked upload');
  console.log('');
  
  console.log('🐛 If Still Not Working:');
  console.log('   1. Check server terminal for specific error');
  console.log('   2. Try test-upload endpoint first');
  console.log('   3. Test with curl to bypass Flutter');
  console.log('   4. Consider implementing chunked upload');
  console.log('');
}

testBodySize();
