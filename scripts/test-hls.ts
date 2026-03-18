/**
 * Test script for HLS video processing
 * 
 * This script tests the video-to-HLS conversion without requiring a full server setup.
 * It processes a sample video and verifies that HLS chunks are created correctly.
 * 
 * Usage:
 *   1. Place a test video file in the project root (e.g., test-video.mp4)
 *   2. Run: npx ts-node scripts/test-hls.ts
 */

import { processVideoToHLS, validateVideoFile } from '../src/lib/video-processing';
import path from 'path';
import fs from 'fs';

async function testHLSProcessing() {
  console.log('🎬 HLS Video Processing Test\n');
  
  // Configuration
  const testVideoPath = path.join(process.cwd(), 'test-video.mp4');
  const outputDir = path.join(process.cwd(), 'test-output', 'hls-test');
  
  // Check if test video exists
  if (!fs.existsSync(testVideoPath)) {
    console.error('❌ Test video not found!');
    console.log('   Please place a test video file at:', testVideoPath);
    console.log('   You can use any .mp4 video file for testing.\n');
    process.exit(1);
  }
  
  console.log('📁 Test video:', testVideoPath);
  console.log('📁 Output directory:', outputDir);
  console.log('');
  
  try {
    // Step 1: Validate video file
    console.log('1️⃣  Validating video file...');
    const isValid = await validateVideoFile(testVideoPath);
    
    if (!isValid) {
      console.error('❌ Video validation failed!');
      process.exit(1);
    }
    console.log('✅ Video file is valid\n');
    
    // Step 2: Process video to HLS
    console.log('2️⃣  Processing video to HLS chunks...');
    console.log('   This may take a few minutes depending on video length...\n');
    
    const result = await processVideoToHLS({
      inputPath: testVideoPath,
      outputDir: outputDir,
    });
    
    console.log('✅ HLS processing complete!\n');
    
    // Step 3: Display results
    console.log('📊 Processing Results:');
    console.log('   Master Playlist:', result.masterPlaylistUrl);
    console.log('   Thumbnail:', result.thumbnailUrl);
    console.log('   Duration:', result.duration, 'seconds');
    console.log('   Resolution:', `${result.width}x${result.height}`);
    console.log('');
    
    console.log('📹 Quality Levels:');
    result.qualities.forEach((quality, index) => {
      console.log(`   ${index + 1}. ${quality.quality.toUpperCase()}`);
      console.log(`      - Playlist: ${quality.playlistUrl}`);
      console.log(`      - Resolution: ${quality.resolution}`);
    });
    console.log('');
    
    // Step 4: Verify files exist
    console.log('3️⃣  Verifying output files...');
    
    const masterPlaylistPath = path.join(outputDir, result.masterPlaylistUrl);
    const thumbnailPath = path.join(outputDir, result.thumbnailUrl);
    
    const checks = [
      { name: 'Master Playlist', path: masterPlaylistPath },
      { name: 'Thumbnail', path: thumbnailPath },
    ];
    
    // Add quality playlists to checks
    result.qualities.forEach(quality => {
      checks.push({
        name: `${quality.quality} Playlist`,
        path: path.join(outputDir, quality.playlistUrl),
      });
    });
    
    let allFilesExist = true;
    for (const check of checks) {
      const exists = fs.existsSync(check.path);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (!exists) allFilesExist = false;
    }
    console.log('');
    
    // Step 5: Count chunks
    console.log('4️⃣  Counting video chunks...');
    result.qualities.forEach(quality => {
      const qualityDir = path.join(outputDir, quality.quality);
      const chunks = fs.readdirSync(qualityDir).filter(f => f.endsWith('.ts'));
      console.log(`   ${quality.quality}: ${chunks.length} chunks (${chunks.length * 4} seconds)`);
    });
    console.log('');
    
    // Final summary
    if (allFilesExist) {
      console.log('🎉 SUCCESS! HLS processing is working correctly!');
      console.log('');
      console.log('📂 Output files location:');
      console.log('   ', outputDir);
      console.log('');
      console.log('🎬 To test playback:');
      console.log('   1. Copy the output folder to public/videos/');
      console.log('   2. Access the master playlist at:');
      console.log('      http://localhost:3000/videos/hls-test/master.m3u8');
      console.log('   3. Use VLC or any HLS player to test playback');
    } else {
      console.error('❌ Some files are missing. Check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during HLS processing:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testHLSProcessing().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
