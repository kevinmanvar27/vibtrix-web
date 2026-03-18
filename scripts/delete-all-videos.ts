/**
 * Delete All Videos Script
 * 
 * This script deletes all video entries from the database and their associated files.
 * Run this before manually uploading new reels to start fresh.
 * 
 * Usage: npx ts-node scripts/delete-all-videos.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function deleteAllVideos() {
  console.log('🗑️  Deleting All Videos from Database\n');
  
  try {
    // Step 1: Find all video media entries
    console.log('1️⃣  Finding all videos in database...');
    const videos = await prisma.media.findMany({
      where: {
        type: 'VIDEO'
      },
      select: {
        id: true,
        url: true,
        urlHigh: true,
        urlMedium: true,
        urlLow: true,
        urlThumbnail: true,
        postId: true,
      }
    });
    
    console.log(`   Found ${videos.length} videos\n`);
    
    if (videos.length === 0) {
      console.log('✅ No videos found in database. Nothing to delete.');
      return;
    }
    
    // Step 2: Delete video files from disk
    console.log('2️⃣  Deleting video files from disk...');
    const videosDir = path.join(process.cwd(), 'public', 'videos');
    
    if (fs.existsSync(videosDir)) {
      const videoFolders = fs.readdirSync(videosDir);
      console.log(`   Found ${videoFolders.length} video folders`);
      
      for (const folder of videoFolders) {
        const folderPath = path.join(videosDir, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          try {
            fs.rmSync(folderPath, { recursive: true, force: true });
            console.log(`   ✓ Deleted: ${folder}`);
          } catch (err) {
            console.log(`   ✗ Failed to delete: ${folder}`, err);
          }
        }
      }
    } else {
      console.log('   No videos directory found');
    }
    console.log('');
    
    // Step 3: Delete video media records from database
    console.log('3️⃣  Deleting video records from database...');
    const deleteResult = await prisma.media.deleteMany({
      where: {
        type: 'VIDEO'
      }
    });
    
    console.log(`   ✓ Deleted ${deleteResult.count} video records\n`);
    
    // Step 4: Show summary
    console.log('📊 Summary:');
    console.log(`   Videos found: ${videos.length}`);
    console.log(`   Videos deleted: ${deleteResult.count}`);
    console.log('');
    
    console.log('🎉 SUCCESS! All videos have been deleted from database.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. You can now manually upload new reels through the app');
    console.log('   2. New videos will be automatically processed into HLS format');
    console.log('   3. Videos will have progressive loading (Instagram-style)');
    
  } catch (error) {
    console.error('❌ Error deleting videos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL videos from the database!\n');
console.log('This includes:');
console.log('  - All video media records');
console.log('  - All video files from public/videos/');
console.log('  - Posts will remain but without video attachments\n');

// Run the deletion
deleteAllVideos().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
