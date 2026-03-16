import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database...\n');
  
  try {
    // Count posts
    const postCount = await prisma.post.count();
    console.log(`📝 Total posts: ${postCount}`);
    
    // Get sample posts
    const posts = await prisma.post.findMany({
      take: 5,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Recent posts:');
    posts.forEach((post, i) => {
      console.log(`${i + 1}. ${post.user.displayName} (@${post.user.username}): "${post.content.substring(0, 50)}..."`);
    });
    
    // Check if API is working
    console.log('\n✅ Database connection is working!');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
