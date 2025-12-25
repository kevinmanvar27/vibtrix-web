const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeUserProfilePublic() {
  console.log('Making user profile public...');
  
  const postId = 'cm9l8up8x000ltu1gh5yfv61d';

  try {
    // 1. Get the post to find the user
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            isProfilePublic: true
          }
        }
      }
    });

    if (!post) {
      console.log(`Post with ID ${postId} not found.`);
      return;
    }

    const user = post.user;
    console.log(`Found user: ${user.displayName} (@${user.username})`);
    console.log(`Current profile visibility: ${user.isProfilePublic ? 'Public' : 'Private'}`);
    
    if (user.isProfilePublic) {
      console.log('User profile is already public. No changes needed.');
      return;
    }
    
    // 2. Update the user's profile to make it public
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isProfilePublic: true
      }
    });
    
    console.log(`User profile updated to: ${updatedUser.isProfilePublic ? 'Public' : 'Private'}`);
    console.log('The post should now appear in the regular feed for all users.');
    
  } catch (error) {
    console.error('Error updating user profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeUserProfilePublic()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script failed:', error));
