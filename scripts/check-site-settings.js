// Script to check current site settings
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSiteSettings() {
  try {
    console.log('Checking site settings...');
    
    // Check if settings exist
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
    });
    
    if (!settings) {
      console.log('No settings found.');
    } else {
      console.log('Current site settings:');
      console.log('- messagingEnabled:', settings.messagingEnabled);
      console.log('- viewsEnabled:', settings.viewsEnabled);
      console.log('- likesEnabled:', settings.likesEnabled);
      console.log('- commentsEnabled:', settings.commentsEnabled);
      console.log('- sharingEnabled:', settings.sharingEnabled);
      console.log('- bookmarksEnabled:', settings.bookmarksEnabled);
      console.log('- advertisementsEnabled:', settings.advertisementsEnabled);
      console.log('- loginActivityTrackingEnabled:', settings.loginActivityTrackingEnabled);
      console.log('- userBlockingEnabled:', settings.userBlockingEnabled);
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSiteSettings();