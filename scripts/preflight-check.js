#!/usr/bin/env node
/**
 * Pre-Flight Check: Verify Video Upload Configuration
 * 
 * Run this before testing video uploads to ensure everything is configured correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🔍 PRE-FLIGHT CHECK: Video Upload Configuration');
console.log('='.repeat(70) + '\n');

let allChecksPassed = true;

// Check 1: Custom server file exists
console.log('✓ Check 1: Custom server file...');
const serverPath = path.join(process.cwd(), 'server.js');
if (fs.existsSync(serverPath)) {
  console.log('  ✅ server.js exists\n');
} else {
  console.log('  ❌ server.js NOT FOUND');
  console.log('     This file is REQUIRED for large file uploads\n');
  allChecksPassed = false;
}

// Check 2: Start script uses custom server
console.log('✓ Check 2: Dev script configuration...');
const startDevPath = path.join(process.cwd(), 'scripts', 'start-dev.js');
if (fs.existsSync(startDevPath)) {
  const content = fs.readFileSync(startDevPath, 'utf-8');
  if (content.includes('server.js')) {
    console.log('  ✅ start-dev.js uses custom server\n');
  } else {
    console.log('  ❌ start-dev.js does NOT use custom server');
    console.log('     The script should start server.js, not next dev\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ⚠️  start-dev.js not found (using default)\n');
}

// Check 3: Environment configuration
console.log('✓ Check 3: Environment configuration...');
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  if (envContent.includes('NODE_OPTIONS')) {
    console.log('  ✅ .env.local has NODE_OPTIONS\n');
  } else {
    console.log('  ⚠️  NODE_OPTIONS not found in .env.local');
    console.log('     This is set in start-dev.js instead\n');
  }
} else {
  console.log('  ⚠️  .env.local not found (using defaults)\n');
}

// Check 4: Next.js config
console.log('✓ Check 4: Next.js configuration...');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
  if (configContent.includes('serverActions')) {
    console.log('  ✅ next.config.mjs has serverActions config\n');
  } else {
    console.log('  ⚠️  serverActions config not found');
    console.log('     This only affects Server Actions, not API routes\n');
  }
} else {
  console.log('  ❌ next.config.mjs NOT FOUND\n');
  allChecksPassed = false;
}

// Check 5: Upload route exists
console.log('✓ Check 5: Upload API route...');
const uploadRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'upload', 'route.ts');
if (fs.existsSync(uploadRoutePath)) {
  const routeContent = fs.readFileSync(uploadRoutePath, 'utf-8');
  if (routeContent.includes('processVideoToHLS')) {
    console.log('  ✅ Upload route has HLS processing\n');
  } else {
    console.log('  ⚠️  HLS processing not found in upload route\n');
  }
} else {
  console.log('  ❌ Upload route NOT FOUND');
  console.log('     Expected at: src/app/api/upload/route.ts\n');
  allChecksPassed = false;
}

// Check 6: Video processing library exists
console.log('✓ Check 6: Video processing library...');
const videoProcessingPath = path.join(process.cwd(), 'src', 'lib', 'video-processing.ts');
if (fs.existsSync(videoProcessingPath)) {
  console.log('  ✅ video-processing.ts exists\n');
} else {
  console.log('  ❌ video-processing.ts NOT FOUND');
  console.log('     This is REQUIRED for HLS conversion\n');
  allChecksPassed = false;
}

// Check 7: FFmpeg package installed
console.log('✓ Check 7: FFmpeg package...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasFfmpeg = packageJson.dependencies?.['fluent-ffmpeg'] || 
                    packageJson.dependencies?.['@ffmpeg-installer/ffmpeg'];
  if (hasFfmpeg) {
    console.log('  ✅ FFmpeg packages installed\n');
  } else {
    console.log('  ❌ FFmpeg packages NOT FOUND');
    console.log('     Run: npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg\n');
    allChecksPassed = false;
  }
} else {
  console.log('  ❌ package.json NOT FOUND\n');
  allChecksPassed = false;
}

// Check 8: Uploads directory exists
console.log('✓ Check 8: Uploads directory...');
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
if (fs.existsSync(uploadsPath)) {
  console.log('  ✅ public/uploads directory exists\n');
} else {
  console.log('  ⚠️  public/uploads directory not found');
  console.log('     It will be created automatically on first upload\n');
}

// Final summary
console.log('='.repeat(70));
if (allChecksPassed) {
  console.log('✅ ALL CRITICAL CHECKS PASSED');
  console.log('='.repeat(70) + '\n');
  console.log('🚀 Ready to test video uploads!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Upload a video from Flutter app');
  console.log('3. Watch the server terminal for logs\n');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('='.repeat(70) + '\n');
  console.log('⚠️  Please fix the issues above before testing uploads.');
  console.log('   Review FINAL_VIDEO_UPLOAD_FIX.md for details.\n');
  process.exit(1);
}
