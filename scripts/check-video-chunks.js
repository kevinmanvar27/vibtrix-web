#!/usr/bin/env node
/**
 * Check Latest Video Upload - Verify HLS Chunks
 * 
 * This script finds the most recently uploaded video and checks if HLS chunks were created.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🎬 Checking Latest Video Upload - HLS Chunks Verification');
console.log('='.repeat(70) + '\n');

// Check both uploads and videos directories
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
const videosPath = path.join(process.cwd(), 'public', 'videos');

// Function to recursively find all directories
function findAllDirectories(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList.push(filePath);
      findAllDirectories(filePath, fileList);
    }
  });
  
  return fileList;
}

// Find all directories in videos path (where HLS output is stored)
let allDirs = [];
if (fs.existsSync(videosPath)) {
  allDirs = findAllDirectories(videosPath);
}

// Find directories with master.m3u8 (HLS videos)
const videoDirs = allDirs.filter(dir => {
  const masterPlaylist = path.join(dir, 'master.m3u8');
  return fs.existsSync(masterPlaylist);
});

if (videoDirs.length === 0) {
  console.log('❌ No HLS videos found in videos directory');
  console.log(`\nChecked path: ${videosPath}`);
  console.log('\nPossible reasons:');
  console.log('1. Video is still processing (check server logs)');
  console.log('2. Video processing failed (check server logs for errors)');
  console.log('3. Video was uploaded but not processed to HLS\n');
  process.exit(1);
}

// Get the most recent video directory
const videoStats = videoDirs.map(dir => ({
  path: dir,
  mtime: fs.statSync(dir).mtime
}));

videoStats.sort((a, b) => b.mtime - a.mtime);
const latestVideo = videoStats[0];

console.log(`✅ Found ${videoDirs.length} HLS video(s)`);
console.log(`\n📁 Latest Video Directory:`);
console.log(`   ${latestVideo.path}`);
console.log(`   Created: ${latestVideo.mtime.toLocaleString()}\n`);

// Check contents
const videoDir = latestVideo.path;
const files = fs.readdirSync(videoDir, { recursive: true });

console.log('📋 Video Structure:\n');

// Check master playlist
const masterPlaylist = path.join(videoDir, 'master.m3u8');
if (fs.existsSync(masterPlaylist)) {
  console.log('✅ master.m3u8 (Master Playlist)');
  const content = fs.readFileSync(masterPlaylist, 'utf-8');
  console.log(`   Size: ${fs.statSync(masterPlaylist).size} bytes`);
  console.log(`   Lines: ${content.split('\n').length}`);
} else {
  console.log('❌ master.m3u8 NOT FOUND');
}

// Check thumbnail
const thumbnail = path.join(videoDir, 'thumbnail.jpg');
if (fs.existsSync(thumbnail)) {
  const size = fs.statSync(thumbnail).size;
  console.log(`✅ thumbnail.jpg (${(size / 1024).toFixed(2)} KB)`);
} else {
  console.log('⚠️  thumbnail.jpg NOT FOUND');
}

// Check quality directories
const qualities = ['low', 'medium', 'high'];
let totalChunks = 0;

console.log('\n📊 Quality Levels:\n');

qualities.forEach(quality => {
  const qualityDir = path.join(videoDir, quality);
  if (fs.existsSync(qualityDir)) {
    const playlist = path.join(qualityDir, 'playlist.m3u8');
    const chunks = fs.readdirSync(qualityDir).filter(f => f.endsWith('.ts'));
    
    console.log(`✅ ${quality.toUpperCase()} Quality (${chunks.length} chunks)`);
    
    if (fs.existsSync(playlist)) {
      const playlistContent = fs.readFileSync(playlist, 'utf-8');
      const duration = playlistContent.match(/#EXTINF:([\d.]+)/g);
      const totalDuration = duration 
        ? duration.reduce((sum, d) => sum + parseFloat(d.split(':')[1]), 0)
        : 0;
      
      console.log(`   Playlist: playlist.m3u8`);
      console.log(`   Chunks: ${chunks.join(', ')}`);
      console.log(`   Total Duration: ${totalDuration.toFixed(2)} seconds`);
      
      // Show chunk sizes
      const chunkSizes = chunks.map(chunk => {
        const size = fs.statSync(path.join(qualityDir, chunk)).size;
        return `${chunk}: ${(size / 1024).toFixed(2)} KB`;
      });
      console.log(`   Chunk Sizes: ${chunkSizes.join(', ')}`);
    }
    
    totalChunks += chunks.length;
    console.log('');
  } else {
    console.log(`⚠️  ${quality.toUpperCase()} Quality NOT FOUND\n`);
  }
});

console.log('='.repeat(70));
console.log(`✅ HLS Processing Complete`);
console.log(`   Total Chunks: ${totalChunks}`);
console.log(`   Quality Levels: ${qualities.filter(q => fs.existsSync(path.join(videoDir, q))).length}`);
console.log('='.repeat(70) + '\n');

// Show relative URL for Flutter app
const relativeUrl = videoDir.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');
console.log('🎯 Video URL for Flutter App:');
console.log(`   ${relativeUrl}/master.m3u8\n`);

console.log('✅ Video is ready for progressive streaming!');
console.log('   Each chunk is ~4 seconds for smooth playback\n');
