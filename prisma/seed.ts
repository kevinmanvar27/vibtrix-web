import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create users
  const users = [];
  const usernames = ['john_doe', 'jane_smith', 'alex_tech', 'sam_creative', 'taylor_media'];
  const displayNames = ['John Doe', 'Jane Smith', 'Alex Tech', 'Sam Creative', 'Taylor Media'];

  for (let i = 0; i < 5; i++) {
    // Simple password hash for demo purposes
    const passwordHash = `hashed_password_${i}`;
    const user = await prisma.user.upsert({
      where: { username: usernames[i] },
      update: {},
      create: {
        id: randomUUID(),
        username: usernames[i],
        displayName: displayNames[i],
        passwordHash,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${usernames[i]}`,
        isActive: true,
      },
    });
    users.push(user);
    console.log(`Created user: ${user.displayName}`);
  }

  // Create follow relationships
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        await prisma.follow.upsert({
          where: {
            followerId_followingId: {
              followerId: users[i].id,
              followingId: users[j].id,
            },
          },
          update: {},
          create: {
            followerId: users[i].id,
            followingId: users[j].id,
          },
        });
        console.log(`${users[i].displayName} follows ${users[j].displayName}`);
      }
    }
  }

  // Create posts with hashtags
  const hashtags = ['#coding', '#design', '#technology', '#art', '#music', '#travel', '#food', '#fitness'];
  const postContents = [
    'Just finished a new project! #coding #technology',
    'Exploring new design trends today #design #art',
    'Learning about AI and machine learning #technology #coding',
    'Created a new artwork #art #design',
    'Listening to my favorite playlist while working #music #coding',
    'Planning my next trip #travel #photography',
    'Tried a new recipe today #food #cooking',
    'Morning workout done! #fitness #health',
    'Working on a new mobile app #coding #technology #design',
    'Visited an amazing art gallery #art #travel',
  ];

  for (let i = 0; i < 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const post = await prisma.post.create({
      data: {
        id: `post_${i}`,
        content: postContents[i],
        userId: randomUser.id,
      },
    });
    console.log(`Created post: ${post.id}`);
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
