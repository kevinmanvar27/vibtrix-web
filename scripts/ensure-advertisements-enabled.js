const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if settings exist
    let settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      // Create settings if they don't exist
      console.log('Creating site settings...');
      settings = await prisma.siteSettings.create({
        data: {
          id: 'settings',
          advertisementsEnabled: true,
          updatedAt: new Date(),
        },
      });
      console.log('Site settings created successfully');
    } else {
      // Update settings to ensure advertisementsEnabled is true
      console.log('Updating site settings...');
      settings = await prisma.siteSettings.update({
        where: { id: 'settings' },
        data: {
          advertisementsEnabled: true,
          updatedAt: new Date(),
        },
      });
      console.log('Site settings updated successfully');
    }

    console.log('Current settings:', settings);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
