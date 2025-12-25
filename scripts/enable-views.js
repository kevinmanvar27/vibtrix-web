// Script to ensure views feature is enabled in site settings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableViews() {
  try {
    console.log('Checking site settings...');
    
    // Check if settings exist
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { 
        viewsEnabled: true,
      },
    });
    
    if (!settings) {
      console.log('No settings found. Creating settings with views enabled...');
      
      // Create settings with views enabled
      await prisma.siteSettings.create({
        data: {
          id: "settings",
          messagingEnabled: true,
          likesEnabled: true,
          commentsEnabled: true,
          sharingEnabled: true,
          userBlockingEnabled: true,
          loginActivityTrackingEnabled: true,
          viewsEnabled: true,
          bookmarksEnabled: true,
          advertisementsEnabled: true,
        },
      });
      
      console.log('Settings created successfully with views enabled.');
    } else if (!settings.viewsEnabled) {
      console.log('Views feature is currently disabled. Enabling views...');
      
      // Update settings to enable views
      await prisma.siteSettings.update({
        where: { id: "settings" },
        data: {
          viewsEnabled: true,
        },
      });
      
      console.log('Views feature enabled successfully.');
    } else {
      console.log('Views feature is already enabled.');
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableViews();