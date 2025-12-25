// This script initializes Razorpay settings in the database
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Initializing Razorpay settings...');

    // Get Razorpay keys from environment variables
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay keys not found in environment variables');
      process.exit(1);
    }

    // First, ensure the columns exist
    try {
      console.log('Ensuring Razorpay columns exist...');
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT`;
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT`;
      console.log('Columns added or already exist');
    } catch (error) {
      console.error('Error ensuring Razorpay columns exist:', error);
      // Continue anyway, as we'll try a different approach
    }

    // Try to update site settings using raw SQL
    try {
      console.log('Updating site settings...');

      // First, check if settings record exists
      const existingSettings = await prisma.siteSettings.findUnique({
        where: { id: 'settings' },
      });

      if (!existingSettings) {
        // Create new settings record if it doesn't exist
        console.log('Creating new settings record...');
        await prisma.$executeRaw`
          INSERT INTO site_settings (
            id, "maxImageSize", "minVideoDuration", "maxVideoDuration",
            "googleLoginEnabled", "manualSignupEnabled",
            "paytmEnabled", "phonePeEnabled", "gPayEnabled", "razorpayEnabled",
            "timezone", "updatedAt"
          ) VALUES (
            'settings', 5242880, 3, 60,
            true, true,
            false, false, false, true,
            'Asia/Kolkata', NOW()
          )
        `;
        console.log('Settings record created');
      } else {
        // Update razorpayEnabled flag
        console.log('Updating razorpayEnabled flag...');
        await prisma.$executeRaw`UPDATE site_settings SET "razorpayEnabled" = true, "updatedAt" = NOW() WHERE id = 'settings'`;
      }

      // Now update the Razorpay keys
      console.log('Updating Razorpay keys...');
      await prisma.$executeRaw`UPDATE site_settings SET "razorpayKeyId" = ${razorpayKeyId}, "razorpayKeySecret" = ${razorpayKeySecret}, "updatedAt" = NOW() WHERE id = 'settings'`;
      console.log('Razorpay keys updated successfully');
    } catch (error) {
      console.error('Error updating site settings:', error);
      process.exit(1);
    }

    // Get the updated settings to display
    const updatedSettings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    console.log('Razorpay settings initialized successfully');
    console.log('Settings:', {
      ...updatedSettings,
      razorpayKeySecret: '********', // Hide secret key in logs
    });
  } catch (error) {
    console.error('Error initializing Razorpay settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
