/**
 * Test script to verify FFmpeg installation
 * Run with: npx tsx scripts/test-ffmpeg.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testFFmpeg() {
  console.log('🔍 Testing FFmpeg Installation...\n');
  
  try {
    // Get FFmpeg path from installed package
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    const ffprobePath = require('@ffprobe-installer/ffprobe').path;
    
    console.log('📦 Package paths:');
    console.log(`   FFmpeg: ${ffmpegPath}`);
    console.log(`   FFprobe: ${ffprobePath}\n`);
    
    // Test FFmpeg
    console.log('1️⃣ Testing FFmpeg...');
    try {
      const { stdout: ffmpegVersion } = await execAsync(`"${ffmpegPath}" -version`);
      const versionLine = ffmpegVersion.split('\n')[0];
      console.log(`   ✅ ${versionLine}\n`);
    } catch (error) {
      console.log(`   ❌ FFmpeg test failed:`, error);
      console.log('');
    }
    
    // Test FFprobe
    console.log('2️⃣ Testing FFprobe...');
    try {
      const { stdout: ffprobeVersion } = await execAsync(`"${ffprobePath}" -version`);
      const versionLine = ffprobeVersion.split('\n')[0];
      console.log(`   ✅ ${versionLine}\n`);
    } catch (error) {
      console.log(`   ❌ FFprobe test failed:`, error);
      console.log('');
    }
    
    console.log('✅ FFmpeg is properly installed and working!\n');
    console.log('💡 If video upload still fails, check:');
    console.log('   1. Server logs for detailed error messages');
    console.log('   2. Video file format (should be MP4, MOV, etc.)');
    console.log('   3. Available disk space');
    console.log('   4. File permissions on public/videos/ directory');
    
  } catch (error) {
    console.log('❌ Error testing FFmpeg:', error);
    console.log('\n💡 Try reinstalling FFmpeg packages:');
    console.log('   npm install @ffmpeg-installer/ffmpeg @ffprobe-installer/ffprobe');
  }
}

testFFmpeg();
