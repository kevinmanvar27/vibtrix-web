// This script finds all rounds for a competition
// Usage: node scripts/find-competition-rounds.js <competitionId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID from command line arguments
    const competitionId = process.argv[2];
    
    if (!competitionId) {
      console.error('Error: Competition ID is required');
      console.log('Usage: node scripts/find-competition-rounds.js <competitionId>');
      process.exit(1);
    }

    console.log(`Finding rounds for competition: ${competitionId}`);

    // Find the competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      console.error(`Error: Competition with ID ${competitionId} not found`);
      process.exit(1);
    }

    console.log(`Found competition: "${competition.title}" with ${competition.rounds.length} rounds`);

    // Print the rounds
    console.log('\nRounds:');
    competition.rounds.forEach((round, index) => {
      console.log(`- Round ${index + 1}: "${round.name}", ID: ${round.id}, Likes to Pass: ${round.likesToPass || 'Not set'}`);
      console.log(`  Start: ${new Date(round.startDate).toLocaleString()}, End: ${new Date(round.endDate).toLocaleString()}`);
    });

  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
