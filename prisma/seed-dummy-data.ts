/**
 * Seed script to add dummy data for testing the mobile app
 * Run with: npx ts-node prisma/seed-dummy-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

// Sample avatar URLs (using placeholder images)
const avatarUrls = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
];

// Sample video URLs (using sample videos)
const videoUrls = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

// Sample image URLs
const imageUrls = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682687221038-404670f09439?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682695794816-7b9da18ed470?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682686580391-615b1f28e5ee?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682686581362-7c44ed6d1e8f?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&h=1200&fit=crop',
];

// Sample captions
const captions = [
  "Living my best life! 🌟 #vibtrix #lifestyle",
  "Just another beautiful day ☀️ #blessed #happy",
  "Dance like nobody's watching 💃 #dance #fun",
  "Weekend vibes only 🎉 #weekend #party",
  "Chasing dreams and catching sunsets 🌅 #motivation",
  "Good times with great people 👯 #friends #memories",
  "Making memories one day at a time 📸 #travel",
  "Stay positive, work hard, make it happen 💪 #hustle",
  "Life is short, smile while you still have teeth 😁 #funny",
  "Adventure awaits! 🏔️ #adventure #explore",
  "Coffee first, adulting second ☕ #coffee #mood",
  "Keep calm and carry on 🧘 #peaceful #zen",
  "New day, new opportunities 🌈 #newbeginnings",
  "Dream big, work hard 🚀 #goals #success",
  "Happiness is homemade 🏠 #home #cozy",
];

// Generate random ID
function generateId(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random date within last N days
function randomDate(daysAgo: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function main() {
  console.log('🌱 Starting seed...');

  // Create dummy users
  const users: any[] = [];
  const usernames = [
    'sarah_dance', 'mike_fitness', 'emma_travel', 'alex_music',
    'priya_art', 'raj_tech', 'lisa_food', 'john_sports',
    'nina_fashion', 'david_comedy'
  ];
  const displayNames = [
    'Sarah Johnson', 'Mike Williams', 'Emma Davis', 'Alex Chen',
    'Priya Sharma', 'Raj Patel', 'Lisa Anderson', 'John Smith',
    'Nina Rodriguez', 'David Kim'
  ];

  const passwordHash = await hash('Test123!', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  console.log('Creating users...');
  for (let i = 0; i < usernames.length; i++) {
    const existingUser = await prisma.user.findUnique({
      where: { username: usernames[i] }
    });

    if (existingUser) {
      console.log(`  User ${usernames[i]} already exists, skipping...`);
      users.push(existingUser);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        id: generateId(),
        username: usernames[i],
        displayName: displayNames[i],
        email: `${usernames[i]}@example.com`,
        emailVerified: true,
        passwordHash,
        avatarUrl: avatarUrls[i % avatarUrls.length],
        bio: `Hey! I'm ${displayNames[i].split(' ')[0]}. Love creating content and connecting with amazing people! 🎬`,
        isActive: true,
        isProfilePublic: true,
        role: 'USER',
      },
    });
    users.push(user);
    console.log(`  Created user: ${user.username}`);
  }

  // Get the main test user (kevin-manvar-aslh)
  const mainUser = await prisma.user.findUnique({
    where: { username: 'kevin-manvar-aslh' }
  });

  if (mainUser) {
    users.push(mainUser);
  }

  // Create follows between users
  console.log('Creating follow relationships...');
  for (const user of users) {
    // Each user follows 3-5 random other users
    const followCount = randomInt(3, 5);
    const otherUsers = users.filter(u => u.id !== user.id);
    const shuffled = otherUsers.sort(() => Math.random() - 0.5);
    const toFollow = shuffled.slice(0, followCount);

    for (const followUser of toFollow) {
      try {
        await prisma.follow.create({
          data: {
            followerId: user.id,
            followingId: followUser.id,
          },
        });
      } catch (e) {
        // Ignore duplicate follows
      }
    }
  }
  console.log('  Follow relationships created');

  // Create posts for each user
  console.log('Creating posts...');
  const posts: any[] = [];
  for (const user of users) {
    const postCount = randomInt(2, 5);
    for (let i = 0; i < postCount; i++) {
      const isVideo = Math.random() > 0.4; // 60% videos, 40% images
      const mediaUrl = isVideo ? randomElement(videoUrls) : randomElement(imageUrls);
      
      const post = await prisma.post.create({
        data: {
          id: generateId(),
          content: randomElement(captions),
          userId: user.id,
          createdAt: randomDate(30),
          attachments: {
            create: {
              id: generateId(),
              type: isVideo ? 'VIDEO' : 'IMAGE',
              url: mediaUrl,
              urlThumbnail: isVideo ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop' : mediaUrl,
              width: isVideo ? 1920 : 800,
              height: isVideo ? 1080 : 1200,
              duration: isVideo ? randomInt(10, 60) : null,
            },
          },
        },
      });
      posts.push(post);
      console.log(`  Created post by ${user.username}: ${post.id}`);
    }
  }

  // Create likes on posts
  console.log('Creating likes...');
  for (const post of posts) {
    const likeCount = randomInt(5, 30);
    const shuffledUsers = users.sort(() => Math.random() - 0.5);
    const likers = shuffledUsers.slice(0, Math.min(likeCount, users.length));

    for (const liker of likers) {
      if (liker.id !== post.userId) {
        try {
          await prisma.like.create({
            data: {
              userId: liker.id,
              postId: post.id,
            },
          });
        } catch (e) {
          // Ignore duplicates
        }
      }
    }
  }
  console.log('  Likes created');

  // Create comments on posts
  console.log('Creating comments...');
  const commentTexts = [
    "Amazing! 🔥", "Love this!", "So cool! 😍", "Great content!",
    "Keep it up! 💪", "This is awesome!", "Wow! 🤩", "Beautiful!",
    "Nice one!", "Incredible! 👏", "Love your style!", "Goals! 🎯",
    "This made my day!", "So inspiring!", "You're amazing!",
  ];

  for (const post of posts) {
    const commentCount = randomInt(2, 10);
    for (let i = 0; i < commentCount; i++) {
      const commenter = randomElement(users);
      if (commenter.id !== post.userId) {
        await prisma.comment.create({
          data: {
            id: generateId(),
            content: randomElement(commentTexts),
            userId: commenter.id,
            postId: post.id,
            createdAt: randomDate(7),
          },
        });
      }
    }
  }
  console.log('  Comments created');

  // Create a competition
  console.log('Creating competition...');
  const existingCompetition = await prisma.competition.findFirst({
    where: { title: 'Dance Challenge 2025' }
  });

  let competition;
  if (!existingCompetition) {
    competition = await prisma.competition.create({
      data: {
        id: generateId(),
        title: 'Dance Challenge 2025',
        description: 'Show us your best dance moves! Top performers win amazing prizes. Upload your best dance video and get likes to win!',
        slug: 'dance-challenge-2025',
        isPaid: false,
        mediaType: 'VIDEO_ONLY',
        isActive: true,
        hasPrizes: true,
        defaultHashtag: '#DanceChallenge2025',
        rounds: {
          create: {
            id: generateId(),
            name: 'Round 1',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            likesToPass: 100,
          },
        },
        prizes: {
          create: [
            { id: generateId(), position: 'FIRST', amount: 10000, description: 'First Prize - ₹10,000' },
            { id: generateId(), position: 'SECOND', amount: 5000, description: 'Second Prize - ₹5,000' },
            { id: generateId(), position: 'THIRD', amount: 2500, description: 'Third Prize - ₹2,500' },
          ],
        },
      },
    });
    console.log(`  Created competition: ${competition.title}`);
  } else {
    competition = existingCompetition;
    console.log(`  Competition already exists: ${competition.title}`);
  }

  // Create notifications for the main user
  if (mainUser) {
    console.log('Creating notifications for main user...');
    const notificationTypes = ['LIKE', 'COMMENT', 'FOLLOW'];
    
    for (let i = 0; i < 10; i++) {
      const issuer = randomElement(users.filter(u => u.id !== mainUser.id));
      const type = randomElement(notificationTypes);
      
      try {
        await prisma.notification.create({
          data: {
            id: generateId(),
            recipientId: mainUser.id,
            issuerId: issuer.id,
            type: type as any,
            postId: type !== 'FOLLOW' ? randomElement(posts).id : null,
            read: Math.random() > 0.5,
            createdAt: randomDate(7),
          },
        });
      } catch (e) {
        // Ignore errors
      }
    }
    console.log('  Notifications created');
  }

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Posts: ${posts.length}`);
  console.log(`  - Competition: ${competition?.title || 'N/A'}`);
  console.log('\n🔑 Test Credentials:');
  console.log('  Username: kevin-manvar-aslh');
  console.log('  Password: Test123!');
  console.log('\n  Or any of the new users:');
  usernames.forEach(u => console.log(`  - ${u} / Test123!`));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
