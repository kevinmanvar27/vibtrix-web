// This script finds a competition by its slug
// Usage: node scripts/find-competition-by-slug.js <slug>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the slug from command line arguments
    const slug = process.argv[2];
    
    if (!slug) {
      console.error('Error: Slug is required');
      console.log('Usage: node scripts/find-competition-by-slug.js <slug>');
      process.exit(1);
    }

    console.log(`Finding competition with slug: ${slug}`);

    // Find the competition
    const competition = await prisma.competition.findUnique({
      where: { slug },
    });

    if (!competition) {
      console.error(`Error: Competition with slug ${slug} not found`);
      process.exit(1);
    }

    console.log(`Found competition: "${competition.title}" with ID: ${competition.id}`);
    console.log(competition);

  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
