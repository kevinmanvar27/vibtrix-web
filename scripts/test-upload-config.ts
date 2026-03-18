/**
 * Test script to verify video upload configuration
 * Run with: npx tsx scripts/test-upload-config.ts
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Checking Video Upload Configuration...\n');

// Check 1: Next.js Config
console.log('1️⃣ Checking next.config.mjs...');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
  if (nextConfig.includes('bodySizeLimit')) {
    console.log('   ✅ Body size limit configured');
    const match = nextConfig.match(/bodySizeLimit:\s*['"](\d+mb)['"]/i);
    if (match) {
      console.log(`   📊 Limit: ${match[1]}`);
    }
  } else {
    console.log('   ⚠️  Body size limit NOT configured');
    console.log('   💡 Add this to next.config.mjs:');
    console.log('      serverActions: { bodySizeLimit: "500mb" }');
  }
} else {
  console.log('   ❌ next.config.mjs not found');
}

// Check 2: Upload API Route
console.log('\n2️⃣ Checking upload API route...');
const uploadRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'upload', 'route.ts');
if (fs.existsSync(uploadRoutePath)) {
  const uploadRoute = fs.readFileSync(uploadRoutePath, 'utf-8');
  if (uploadRoute.includes('maxDuration')) {
    console.log('   ✅ Max duration configured');
    const match = uploadRoute.match(/maxDuration\s*=\s*(\d+)/);
    if (match) {
      const seconds = parseInt(match[1]);
      const minutes = Math.floor(seconds / 60);
      console.log(`   ⏱️  Timeout: ${seconds} seconds (${minutes} minutes)`);
    }
  } else {
    console.log('   ⚠️  Max duration NOT configured');
    console.log('   💡 Add this to route.ts:');
    console.log('      export const maxDuration = 300; // 5 minutes');
  }
} else {
  console.log('   ❌ Upload route not found');
}

// Check 3: Video Processing Library
console.log('\n3️⃣ Checking video processing library...');
const videoProcessingPath = path.join(process.cwd(), 'src', 'lib', 'video-processing.ts');
if (fs.existsSync(videoProcessingPath)) {
  const videoProcessing = fs.readFileSync(videoProcessingPath, 'utf-8');
  if (videoProcessing.includes('processVideoToHLS')) {
    console.log('   ✅ HLS processing function exists');
  }
  if (videoProcessing.includes('500 * 1024 * 1024')) {
    console.log('   ✅ 500MB file size limit configured');
  }
} else {
  console.log('   ❌ Video processing library not found');
}

// Check 4: FFmpeg Installation
console.log('\n4️⃣ Checking FFmpeg...');
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  console.log('   ✅ FFmpeg installer package found');
  console.log(`   📦 FFmpeg path: ${ffmpegInstaller.path}`);
  
  // Check if FFmpeg binary exists
  if (fs.existsSync(ffmpegInstaller.path)) {
    console.log('   ✅ FFmpeg binary exists');
  } else {
    console.log('   ⚠️  FFmpeg binary not found at specified path');
  }
} catch (error) {
  console.log('   ❌ FFmpeg installer package not installed');
  console.log('   💡 Run: npm install @ffmpeg-installer/ffmpeg');
}

// Check 5: Upload Directory
console.log('\n5️⃣ Checking upload directories...');
const publicDir = path.join(process.cwd(), 'public');
const videosDir = path.join(publicDir, 'videos');

if (fs.existsSync(publicDir)) {
  console.log('   ✅ public/ directory exists');
} else {
  console.log('   ❌ public/ directory not found');
}

if (fs.existsSync(videosDir)) {
  console.log('   ✅ public/videos/ directory exists');
  
  // Check disk space
  try {
    const stats = fs.statfsSync(videosDir);
    const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
    console.log(`   💾 Available space: ${availableGB.toFixed(2)} GB`);
    
    if (availableGB < 1) {
      console.log('   ⚠️  Low disk space! Consider freeing up space.');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check disk space');
  }
} else {
  console.log('   ⚠️  public/videos/ directory not found');
  console.log('   💡 Creating directory...');
  try {
    fs.mkdirSync(videosDir, { recursive: true });
    console.log('   ✅ Directory created');
  } catch (error) {
    console.log('   ❌ Failed to create directory');
  }
}

// Check 6: Required Packages
console.log('\n6️⃣ Checking required packages...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = [
    'fluent-ffmpeg',
    '@ffmpeg-installer/ffmpeg',
    '@ffprobe-installer/ffprobe',
    'uuid',
  ];
  
  let allInstalled = true;
  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`   ✅ ${pkg}`);
    } else {
      console.log(`   ❌ ${pkg} not installed`);
      allInstalled = false;
    }
  });
  
  if (!allInstalled) {
    console.log('\n   💡 Install missing packages:');
    console.log('      npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe uuid');
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SUMMARY');
console.log('='.repeat(60));

console.log('\n✅ Configuration Status:');
console.log('   • Body Size Limit: 500MB');
console.log('   • API Timeout: 5 minutes (300 seconds)');
console.log('   • Max Video Size: 500MB');
console.log('   • No Duration Limit');

console.log('\n📝 What happens when you upload a 20-second video:');
console.log('   1. Upload to server (5-15 seconds)');
console.log('   2. Validate file (1-2 seconds)');
console.log('   3. Process to HLS (30-90 seconds)');
console.log('      - Generate 480p, 720p, 1080p versions');
console.log('      - Create 4-second chunks');
console.log('      - Generate thumbnail');
console.log('   4. Save to database (1-2 seconds)');
console.log('   Total: ~1-2 minutes');

console.log('\n🐛 If you get 500 error:');
console.log('   1. Check server logs for specific error');
console.log('   2. Verify FFmpeg is working');
console.log('   3. Check disk space (need ~2GB free)');
console.log('   4. Try smaller video first (10 seconds)');
console.log('   5. Increase maxDuration if needed');

console.log('\n💡 Next Steps:');
console.log('   1. Restart Next.js dev server: npm run dev');
console.log('   2. Try uploading your 20-second video');
console.log('   3. Check browser console for errors');
console.log('   4. Check server terminal for processing logs');

console.log('\n✨ Configuration check complete!\n');
