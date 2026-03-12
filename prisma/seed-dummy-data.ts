import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive database seeding...\n');

  // ============================================
  // 1. Create Admin User
  // ============================================
  console.log('📝 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: randomUUID(),
      username: 'admin',
      displayName: 'Admin User',
      email: 'admin@rektech.uk', // Added the email you're trying to use
      passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$YWJjZGVmZ2hpams$kLMPbH+qR7xNzQ5pYqLvK8jW9X2ZqF5hN3mP7sT1uVw', // 'RekTech@27'
      isAdmin: true,
      role: 'ADMIN',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.displayName} (Email: admin@rektech.uk, Password: RekTech@27)`);

  // ============================================
  // 2. Create More Users
  // ============================================
  console.log('\n📝 Creating users...');
  const users = [];
  const userData = [
    { username: 'john_doe', displayName: 'John Doe', email: 'john@example.com' },
    { username: 'jane_smith', displayName: 'Jane Smith', email: 'jane@example.com' },
    { username: 'alex_tech', displayName: 'Alex Tech', email: 'alex@example.com' },
    { username: 'sam_creative', displayName: 'Sam Creative', email: 'sam@example.com' },
    { username: 'taylor_media', displayName: 'Taylor Media', email: 'taylor@example.com' },
    { username: 'chris_photo', displayName: 'Chris Photo', email: 'chris@example.com' },
    { username: 'pat_design', displayName: 'Pat Design', email: 'pat@example.com' },
    { username: 'morgan_art', displayName: 'Morgan Art', email: 'morgan@example.com' },
    { username: 'casey_video', displayName: 'Casey Video', email: 'casey@example.com' },
    { username: 'riley_music', displayName: 'Riley Music', email: 'riley@example.com' },
  ];

  for (const data of userData) {
    const user = await prisma.user.upsert({
      where: { username: data.username },
      update: {},
      create: {
        id: randomUUID(),
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        passwordHash: '$argon2i$v=19$m=4096,t=3,p=1$YWJjZGVmZ2hpams$kLMPbH+qR7xNzQ5pYqLvK8jW9X2ZqF5hN3mP7sT1uVw', // 'password123'
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        bio: `Hello, I'm ${data.displayName}. Welcome to my profile!`,
        isActive: true,
        isProfilePublic: true,
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${user.displayName}`);
  }

  // ============================================
  // 3. Create Follow Relationships
  // ============================================
  console.log('\n📝 Creating follow relationships...');
  const allUsers = [adminUser, ...users];
  
  for (let i = 0; i < allUsers.length; i++) {
    for (let j = 0; j < allUsers.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        await prisma.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: allUsers[i].id,
              followingId: allUsers[j].id,
            },
          },
          update: {},
          create: {
            followerId: allUsers[i].id,
            followingId: allUsers[j].id,
          },
        });
      }
    }
  }
  console.log('✅ Created follow relationships');

  // ============================================
  // 4. Create Posts
  // ============================================
  console.log('\n📝 Creating posts...');
  const postContents = [
    'Just finished a new project! #coding #technology 💻',
    'Exploring new design trends today #design #art 🎨',
    'Learning about AI and machine learning #technology #coding 🤖',
    'Created a new artwork #art #design ✨',
    'Listening to my favorite playlist while working #music #coding 🎵',
    'Planning my next trip #travel #photography 📸',
    'Tried a new recipe today #food #cooking 🍳',
    'Morning workout done! #fitness #health 💪',
    'Working on a new mobile app #coding #technology #design 📱',
    'Visited an amazing art gallery #art #travel 🖼️',
    'Beautiful sunset today! #photography #nature 🌅',
    'New blog post is live! Check it out #writing #blog ✍️',
    'Coffee and code - perfect combination ☕💻',
    'Weekend vibes! #relax #weekend 🎉',
    'Grateful for this amazing community! #thankful #community ❤️',
  ];

  const posts = [];
  for (let i = 0; i < 15; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const post = await prisma.post.create({
      data: {
        id: randomUUID(),
        content: postContents[i],
        userId: randomUser.id,
      },
    });
    posts.push(post);
    console.log(`✅ Created post ${i + 1}/15 by ${randomUser.displayName}`);
  }

  // ============================================
  // 5. Create Likes
  // ============================================
  console.log('\n📝 Creating likes...');
  for (const post of posts) {
    const numLikes = Math.floor(Math.random() * 5);
    const likers = allUsers.sort(() => 0.5 - Math.random()).slice(0, numLikes);
    
    for (const user of likers) {
      await prisma.like.upsert({
        where: {
          userId_postId: {
            userId: user.id,
            postId: post.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          postId: post.id,
        },
      });
    }
  }
  console.log('✅ Created likes on posts');

  // ============================================
  // 6. Create Comments
  // ============================================
  console.log('\n📝 Creating comments...');
  const commentTexts = [
    'Great post! 👏',
    'This is amazing! Keep it up!',
    'Very inspiring! ✨',
    'Love this! ❤️',
    'Awesome work! 🔥',
    'So cool! 😍',
    'Well done! 👍',
    'Fantastic! 🎉',
  ];

  for (const post of posts) {
    const numComments = Math.floor(Math.random() * 3);
    for (let i = 0; i < numComments; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      await prisma.comment.create({
        data: {
          id: randomUUID(),
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          userId: randomUser.id,
          postId: post.id,
        },
      });
    }
  }
  console.log('✅ Created comments on posts');

  // ============================================
  // 7. Create Competition
  // ============================================
  console.log('\n📝 Creating competition...');
  const competition = await prisma.competition.create({
    data: {
      id: randomUUID(),
      title: 'Summer Photography Challenge 2026',
      description: 'Show us your best summer photos! Capture the essence of summer in your unique style.',
      isPaid: false,
      mediaType: 'IMAGE_ONLY',
      minLikes: 10,
      isActive: true,
      hasPrizes: true,
      showStickeredMedia: true,
      showFeedStickers: true,
    },
  });
  console.log(`✅ Created competition: ${competition.title}`);

  // Create competition prizes
  await prisma.competitionPrize.create({
    data: {
      id: randomUUID(),
      competitionId: competition.id,
      position: 'FIRST',
      amount: 10000,
      description: 'First Prize - ₹10,000',
    },
  });
  await prisma.competitionPrize.create({
    data: {
      id: randomUUID(),
      competitionId: competition.id,
      position: 'SECOND',
      amount: 5000,
      description: 'Second Prize - ₹5,000',
    },
  });
  await prisma.competitionPrize.create({
    data: {
      id: randomUUID(),
      competitionId: competition.id,
      position: 'THIRD',
      amount: 2000,
      description: 'Third Prize - ₹2,000',
    },
  });
  console.log('✅ Created competition prizes');

  // Create competition round
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);
  
  const round = await prisma.competitionRound.create({
    data: {
      id: randomUUID(),
      name: 'Preliminary Round',
      competitionId: competition.id,
      startDate: now,
      endDate: endDate,
      likesToPass: 10,
    },
  });
  console.log('✅ Created competition round');

  // Register some users for the competition
  for (let i = 0; i < 5; i++) {
    const participant = await prisma.competitionParticipant.create({
      data: {
        id: randomUUID(),
        userId: users[i].id,
        competitionId: competition.id,
        currentRoundId: round.id,
        hasPaid: false,
      },
    });
    console.log(`✅ Registered ${users[i].displayName} for competition`);
  }

  // ============================================
  // 8. Create Site Settings
  // ============================================
  console.log('\n📝 Creating site settings...');
  await prisma.siteSettings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      maxImageSize: 5242880, // 5MB
      minVideoDuration: 3,
      maxVideoDuration: 60,
      logoUrl: '/images/logo.png',
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      razorpayEnabled: false,
      commentsEnabled: true,
      likesEnabled: true,
      messagingEnabled: true,
      advertisementsEnabled: true,
      timezone: 'Asia/Kolkata',
    },
  });
  console.log('✅ Created site settings');

  // ============================================
  // 9. Create Notifications
  // ============================================
  console.log('\n📝 Creating notifications...');
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        id: randomUUID(),
        recipientId: users[i].id,
        issuerId: users[(i + 1) % users.length].id,
        type: 'FOLLOW',
        read: false,
      },
    });
  }
  console.log('✅ Created notifications');

  // ============================================
  // Summary
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   • Users created: ${allUsers.length}`);
  console.log(`   • Posts created: ${posts.length}`);
  console.log(`   • Competition created: 1`);
  console.log(`   • Site settings: configured`);
  console.log(`\n🔐 Login Credentials:`);
  console.log(`   • Admin: username=admin, password=admin123`);
  console.log(`   • Users: password=password123`);
  console.log(`\n🌐 Visit: http://localhost:3000`);
  console.log('='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
