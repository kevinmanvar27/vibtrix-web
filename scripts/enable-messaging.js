// Script to ensure messaging is enabled in site settings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableMessaging() {
  try {
    console.log('Checking site settings...');
    
    // Check if settings exist
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { 
        messagingEnabled: true,
      },
    });
    
    if (!settings) {
      console.log('No settings found. Creating settings with messaging enabled...');
      
      // Create settings with messaging enabled
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
      
      console.log('Settings created successfully with messaging enabled.');
    } else if (!settings.messagingEnabled) {
      console.log('Messaging is currently disabled. Enabling messaging...');
      
      // Update settings to enable messaging
      await prisma.siteSettings.update({
        where: { id: "settings" },
        data: {
          messagingEnabled: true,
        },
      });
      
      console.log('Messaging enabled successfully.');
    } else {
      console.log('Messaging is already enabled.');
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableMessaging();
