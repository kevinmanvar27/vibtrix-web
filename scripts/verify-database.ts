import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 VERIFYING DATABASE DATA\n');
  console.log('='.repeat(50));
  
  // Count users
  const userCount = await prisma.user.count();
  console.log(`👥 Users: ${userCount}`);
  
  // Count posts
  const postCount = await prisma.post.count();
  console.log(`📝 Posts: ${postCount}`);
  
  // Count comments
  const commentCount = await prisma.comment.count();
  console.log(`💬 Comments: ${commentCount}`);
  
  // Count likes
  const likeCount = await prisma.like.count();
  console.log(`❤️  Likes: ${likeCount}`);
  
  // Count follows
  const followCount = await prisma.follow.count();
  console.log(`🔗 Follow relationships: ${followCount}`);
  
  // Count competitions
  const competitionCount = await prisma.competition.count();
  console.log(`🏆 Competitions: ${competitionCount}`);
  
  // Count notifications
  const notificationCount = await prisma.notification.count();
  console.log(`🔔 Notifications: ${notificationCount}`);
  
  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { username: true, displayName: true }
  });
  console.log(`\n👤 Admin user: ${admin ? admin.username : 'Not found'}`);
  
  console.log('='.repeat(50));
  console.log('✅ Database verification complete!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
