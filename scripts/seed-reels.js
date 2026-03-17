/**
 * Seed 100 dummy reels into the database
 * Run: node scripts/seed-reels.js
 */

const mysql = require('mysql2/promise');

// Generate random ID
function generateId(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Sample video URLs (public domain / free videos)
const videoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

// Sample captions
const captions = [
  'Amazing view! 🌟',
  'Check this out! 🔥',
  'Loving this moment 💖',
  'Best day ever! ☀️',
  'Can\'t stop watching this 😍',
  'This is incredible! 🎉',
  'Vibing hard 🎵',
  'Pure magic ✨',
  'Feeling blessed 🙏',
  'Living my best life 💯',
  'Mood: Happy 😊',
  'Nature is beautiful 🌿',
  'Adventure time! 🏔️',
  'Making memories 📸',
  'Good vibes only ✌️',
  'Sunset goals 🌅',
  'Weekend vibes 🎊',
  'Chill mode activated 😎',
  'Epic moment captured! 🎬',
  'Life is good 🌈',
];

async function seedReels() {
  let connection;
  
  try {
    console.log('🌱 Starting to seed reels...');

    // Connect to database
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'vibtrix_next',
    });

    console.log('✅ Connected to database');

    // Get all active users
    const [users] = await connection.execute(
      'SELECT id, username FROM users WHERE isActive = 1'
    );

    if (users.length === 0) {
      console.error('❌ No users found in database!');
      return;
    }

    console.log(`✅ Found ${users.length} users`);

    const reelsToCreate = 100;
    let createdCount = 0;

    for (let i = 0; i < reelsToCreate; i++) {
      // Random user
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Random video URL
      const videoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];
      
      // Random caption
      const caption = captions[Math.floor(Math.random() * captions.length)];
      
      // Random dimensions
      const width = 1080;
      const height = 1920; // Vertical video (reel format)
      
      // Random duration (15-60 seconds)
      const duration = Math.floor(Math.random() * 45) + 15;
      
      // Random created date (last 30 days)
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      // Format date for MySQL
      const mysqlDate = createdAt.toISOString().slice(0, 19).replace('T', ' ');

      try {
        // Create post
        const postId = generateId(16);
        await connection.execute(
          'INSERT INTO posts (id, content, userId, createdAt) VALUES (?, ?, ?, ?)',
          [postId, caption, randomUser.id, mysqlDate]
        );

        // Create video media
        const mediaId = generateId(16);
        const size = Math.floor(Math.random() * 10000000) + 5000000; // 5-15 MB
        
        await connection.execute(
          `INSERT INTO post_media (id, postId, type, url, urlHigh, urlMedium, urlLow, posterUrl, width, height, duration, size, createdAt) 
           VALUES (?, ?, 'VIDEO', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [mediaId, postId, videoUrl, videoUrl, videoUrl, videoUrl, `${videoUrl}#t=0.1`, width, height, duration, size, mysqlDate]
        );

        createdCount++;
        
        // Progress indicator
        if (createdCount % 10 === 0) {
          console.log(`📹 Created ${createdCount}/${reelsToCreate} reels...`);
        }
      } catch (error) {
        console.error(`❌ Error creating reel ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} reels!`);
    console.log('🎉 Seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding reels:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the seed function
seedReels();
