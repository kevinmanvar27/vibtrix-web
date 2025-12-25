const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating advertisements table...');

    // Create AdvertisementStatus enum if it doesn't exist
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advertisementstatus') THEN
            CREATE TYPE "AdvertisementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SCHEDULED', 'EXPIRED');
          END IF;
        END $$;
      `;
      console.log('Created AdvertisementStatus enum');
    } catch (error) {
      console.log('AdvertisementStatus enum already exists or error creating it:', error.message);
    }

    // Create advertisements table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "advertisements" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "adType" "MediaType" NOT NULL,
          "mediaId" TEXT NOT NULL,
          "skipDuration" INTEGER NOT NULL,
          "displayFrequency" INTEGER NOT NULL,
          "scheduleDate" TIMESTAMP(3) NOT NULL,
          "expiryDate" TIMESTAMP(3) NOT NULL,
          "status" "AdvertisementStatus" NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
        );
      `;
      console.log('Created advertisements table');
    } catch (error) {
      console.log('Error creating advertisements table:', error.message);
      // Continue with the script even if there's an error
    }

    // Add foreign key constraint
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'advertisements_mediaId_fkey'
          ) THEN
            ALTER TABLE "advertisements"
            ADD CONSTRAINT "advertisements_mediaId_fkey"
            FOREIGN KEY ("mediaId") REFERENCES "post_media"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
        END $$;
      `;
      console.log('Added foreign key constraint');
    } catch (error) {
      console.log('Error adding foreign key constraint:', error.message);
    }

    // Generate Prisma client with the updated schema
    console.log('Regenerating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client regenerated successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
