/**
 * Seed script to add dummy users and competition entries for leaderboard testing
 * Run: npx tsx prisma/seed-leaderboard.ts
 */

import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

// Dummy user data
const dummyUsers = [
  { username: 'priya_sharma', displayName: 'Priya Sharma', bio: 'Photography enthusiast 📸' },
  { username: 'rahul_verma', displayName: 'Rahul Verma', bio: 'Nature lover 🌿' },
  { username: 'ananya_singh', displayName: 'Ananya Singh', bio: 'Travel blogger ✈️' },
  { username: 'vikram_patel', displayName: 'Vikram Patel', bio: 'Street photographer 🏙️' },
  { username: 'sneha_reddy', displayName: 'Sneha Reddy', bio: 'Portrait artist 🎨' },
  { username: 'arjun_kumar', displayName: 'Arjun Kumar', bio: 'Wildlife photographer 🦁' },
  { username: 'kavya_iyer', displayName: 'Kavya Iyer', bio: 'Food blogger 🍕' },
  { username: 'rohan_mehta', displayName: 'Rohan Mehta', bio: 'Landscape lover 🏔️' },
  { username: 'diya_gupta', displayName: 'Diya Gupta', bio: 'Fashion photographer 👗' },
  { username: 'aditya_joshi', displayName: 'Aditya Joshi', bio: 'Sunset chaser 🌅' },
];

// Avatar URLs (using placeholder service)
const avatarUrls = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=9',
  'https://i.pravatar.cc/150?img=12',
  'https://i.pravatar.cc/150?img=16',
  'https://i.pravatar.cc/150?img=20',
  'https://i.pravatar.cc/150?img=25',
  'https://i.pravatar.cc/150?img=32',
];

// Sample post captions
const captions = [
  'Beautiful summer vibes! ☀️ #SummerPhotography',
  'Captured this amazing moment today 📸',
  'Nature at its finest 🌿✨',
  'Golden hour magic 🌅',
  'My entry for the competition! Hope you like it 💫',
  'Summer memories 🌺',
  'Perfect lighting, perfect shot 📷',
  'Loving this summer challenge! 🎉',
  'My best work so far 🎨',
  'Summer vibes only ☀️🌊',
];

async function main() {
  console.log('🌱 Starting leaderboard seed...');

  // Get the active competition (Summer Photography Challenge)
  const competition = await prisma.competition.findFirst({
    where: {
      title: { contains: 'Summer Photography' },
      isActive: true,
    },
    include: {
      rounds: {
        orderBy: { startDate: 'asc' },
        take: 1,
      },
    },
  });

  if (!competition) {
    console.error('❌ No active Summer Photography competition found!');
    console.log('Please create a competition first.');
    return;
  }

  console.log(`✅ Found competition: ${competition.title}`);

  const round = competition.rounds[0];
  if (!round) {
    console.error('❌ No round found for competition!');
    return;
  }

  console.log(`✅ Using round: ${round.name}`);

  // Create dummy users and competition entries
  for (let i = 0; i < dummyUsers.length; i++) {
    const userData = dummyUsers[i];
    const userId = createId();

    console.log(`\n👤 Creating user ${i + 1}/10: ${userData.username}`);

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          id: userId,
          username: userData.username,
          displayName: userData.displayName,
          bio: userData.bio,
          avatarUrl: avatarUrls[i],
          email: `${userData.username}@example.com`,
          passwordHash: '$2a$10$dummyhashforseeddatadummyhashforseeddata', // Dummy hash
          isActive: true,
        },
      });
      console.log(`  ✅ User created: ${user.username}`);
    } else {
      console.log(`  ⏭️  User already exists: ${user.username}`);
    }

    // Check if already participating
    const existingParticipant = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId: competition.id,
        },
      },
    });

    if (existingParticipant) {
      console.log(`  ⏭️  Already participating in competition`);
      continue;
    }

    // Join competition
    const participant = await prisma.competitionParticipant.create({
      data: {
        id: createId(),
        userId: user.id,
        competitionId: competition.id,
        currentRoundId: round.id,
      },
    });

    console.log(`  ✅ Joined competition`);

    // Create a post for the competition
    const post = await prisma.post.create({
      data: {
        id: createId(),
        userId: user.id,
        content: captions[i],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      },
    });

    console.log(`  ✅ Post created: ${post.id}`);

    // Create competition round entry
    await prisma.competitionRoundEntry.create({
      data: {
        id: createId(),
        participantId: participant.id,
        roundId: round.id,
        postId: post.id,
        visibleInCompetitionFeed: true,
        visibleInNormalFeed: false,
      },
    });

    console.log(`  ✅ Round entry created`);

    // Add random likes (between 5 and 50)
    const likeCount = Math.floor(Math.random() * 46) + 5;
    console.log(`  💖 Adding ${likeCount} likes...`);

    for (let j = 0; j < likeCount; j++) {
      const likeUserId = createId();
      try {
        await prisma.like.create({
          data: {
            userId: likeUserId,
            postId: post.id,
          },
        });
      } catch (e) {
        // Skip if duplicate
      }
    }

    console.log(`  ✅ Added ${likeCount} likes`);
  }

  console.log('\n\n🎉 Leaderboard seed completed successfully!');
  console.log(`✅ Created ${dummyUsers.length} users`);
  console.log(`✅ Created ${dummyUsers.length} competition entries`);
  console.log(`✅ Added random likes to all posts`);
  console.log('\n📱 Now open the app and check the leaderboard!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding leaderboard:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
