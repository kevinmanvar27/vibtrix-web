#!/usr/bin/env node

/**
 * Setup Razorpay Credentials Script
 * 
 * This script will properly configure your Razorpay test credentials
 * to fix the "Payment system authentication failed" error.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Your Razorpay test credentials
const RAZORPAY_KEY_ID = 'rzp_test_Go3jN8rdNmRJ7P';
const RAZORPAY_KEY_SECRET = 'sbD3JVTl7W7UJ18O43cRmtCE';

async function main() {
  console.log('🔧 Setting up Razorpay credentials...');
  console.log('=====================================\n');

  try {
    // Step 1: Ensure the database columns exist
    console.log('1️⃣ Ensuring Razorpay columns exist in database...');
    
    try {
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT`;
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT`;
      console.log('   ✅ Razorpay columns ensured');
    } catch (error) {
      console.log('   ⚠️  Columns might already exist:', error.message);
    }

    // Step 2: Check if settings record exists
    console.log('\n2️⃣ Checking site settings record...');
    
    const existingSettings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!existingSettings) {
      console.log('   📝 Creating new settings record...');
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
      console.log('   ✅ Settings record created');
    } else {
      console.log('   ✅ Settings record exists');
    }

    // Step 3: Update Razorpay credentials
    console.log('\n3️⃣ Setting up Razorpay credentials...');
    
    await prisma.$executeRaw`
      UPDATE site_settings 
      SET "razorpayKeyId" = ${RAZORPAY_KEY_ID},
          "razorpayKeySecret" = ${RAZORPAY_KEY_SECRET},
          "razorpayEnabled" = true,
          "updatedAt" = NOW()
      WHERE id = 'settings'
    `;
    
    console.log('   ✅ Razorpay credentials updated');

    // Step 4: Verify the setup
    console.log('\n4️⃣ Verifying setup...');
    
    const updatedSettings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
      },
    });

    if (updatedSettings) {
      console.log('   📊 Current settings:');
      console.log(`   - Razorpay Enabled: ${updatedSettings.razorpayEnabled ? '✅' : '❌'}`);
      console.log(`   - Key ID: ${updatedSettings.razorpayKeyId ? '✅ ' + updatedSettings.razorpayKeyId.substring(0, 8) + '...' : '❌ Missing'}`);
      console.log(`   - Key Secret: ${updatedSettings.razorpayKeySecret ? '✅ Present (' + updatedSettings.razorpayKeySecret.length + ' chars)' : '❌ Missing'}`);
      
      // Validate format
      if (updatedSettings.razorpayKeyId && updatedSettings.razorpayKeySecret) {
        const keyIdValid = updatedSettings.razorpayKeyId.startsWith('rzp_');
        const keySecretValid = updatedSettings.razorpayKeySecret.length >= 20;
        
        console.log('\n   🔍 Validation:');
        console.log(`   - Key ID format: ${keyIdValid ? '✅' : '❌'} (should start with "rzp_")`);
        console.log(`   - Key Secret length: ${keySecretValid ? '✅' : '❌'} (should be ≥20 chars)`);
        
        if (keyIdValid && keySecretValid) {
          console.log('\n🎉 SUCCESS! Razorpay credentials are properly configured.');
          console.log('\n📋 Next steps:');
          console.log('1. Try making a payment in your application');
          console.log('2. The payment modal should now open without authentication errors');
          console.log('3. Use Razorpay test cards for testing payments');
          console.log('\n💳 Test card details:');
          console.log('   Card Number: 4111 1111 1111 1111');
          console.log('   Expiry: Any future date');
          console.log('   CVV: Any 3 digits');
          console.log('   Name: Any name');
        } else {
          console.log('\n❌ ERROR: Credential format validation failed!');
          console.log('Please check your Razorpay credentials.');
        }
      }
    } else {
      console.log('   ❌ Failed to retrieve updated settings');
    }

    // Step 5: Test the configuration
    console.log('\n5️⃣ Testing configuration...');
    
    try {
      // Import the getRazorpaySettings function to test it
      const { getRazorpaySettings } = require('../src/lib/razorpay.ts');
      const settings = await getRazorpaySettings();
      
      if (settings) {
        console.log('   ✅ Configuration test passed');
        console.log(`   - Source: ${settings.source}`);
        console.log(`   - Enabled: ${settings.enabled}`);
      } else {
        console.log('   ❌ Configuration test failed');
      }
    } catch (error) {
      console.log('   ⚠️  Could not test configuration directly:', error.message);
      console.log('   This is normal if running outside the Next.js environment');
    }

  } catch (error) {
    console.error('❌ Error setting up Razorpay credentials:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure your database is running');
    console.error('2. Check your database connection string');
    console.error('3. Ensure you have proper database permissions');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);
