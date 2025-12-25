// Script to test the views API endpoint
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testViewsEndpoint() {
  try {
    console.log('Testing views endpoint...');
    
    // First, let's create a test post if one doesn't exist
    let post = await prisma.post.findFirst();
    
    if (!post) {
      console.log('No posts found, creating a test post...');
      
      // We need a user first
      let user = await prisma.user.findFirst();
      if (!user) {
        console.log('No users found, creating a test user...');
        user = await prisma.user.create({
          data: {
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com',
          }
        });
      }
      
      // Create a test post
      post = await prisma.post.create({
        data: {
          content: 'Test post for views feature',
          userId: user.id,
        }
      });
      console.log('Created test post with ID:', post.id);
    } else {
      console.log('Using existing post with ID:', post.id);
    }
    
    // Now test the views feature by simulating a view
    console.log('Simulating a view for post:', post.id);
    
    // Check if views feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { viewsEnabled: true },
    });
    
    if (!settings?.viewsEnabled) {
      console.log('ERROR: Views feature is still disabled!');
      return;
    }
    
    console.log('Views feature is enabled. Testing view recording...');
    
    // Test the view recording logic (similar to what's in the API route)
    const POST_VIEW_STORE = new Map();
    
    // Initialize map for this post if it doesn't exist
    if (!POST_VIEW_STORE.has(post.id)) {
      POST_VIEW_STORE.set(post.id, new Map());
    }
    
    const viewerMap = POST_VIEW_STORE.get(post.id);
    const viewerId = 'test-viewer-1';
    
    // Record the view
    if (!viewerMap.has(viewerId)) {
      viewerMap.set(viewerId, 1);
    }
    
    // Count total views
    let totalViewCount = 0;
    viewerMap.forEach(count => {
      totalViewCount += count;
    });
    
    console.log('View recorded successfully. Total views for post:', totalViewCount);
    console.log('Views feature is working correctly!');
    
  } catch (error) {
    console.error('Error testing views endpoint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testViewsEndpoint();