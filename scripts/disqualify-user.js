// This script disqualifies a user from a competition round
// Usage: node scripts/disqualify-user.js <roundId> <username>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the round ID and username from command line arguments
    const roundId = process.argv[2];
    const username = process.argv[3];
    
    if (!roundId || !username) {
      console.error('Error: Round ID and username are required');
      console.log('Usage: node scripts/disqualify-user.js <roundId> <username>');
      process.exit(1);
    }

    console.log(`Disqualifying user ${username} from round ${roundId}`);

    // Find the entry
    const entry = await prisma.competitionRoundEntry.findFirst({
      where: {
        roundId,
        participant: {
          user: {
            username,
          },
        },
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        round: true,
      },
    });

    if (!entry) {
      console.error(`Error: No entry found for user ${username} in round ${roundId}`);
      process.exit(1);
    }

    console.log(`Found entry for user ${entry.participant.user.username} in round "${entry.round.name}"`);

    // Update the entry to disqualify the user
    await prisma.competitionRoundEntry.update({
      where: { id: entry.id },
      data: {
        qualifiedForNextRound: false,
      },
    });

    console.log(`User ${username} has been disqualified from round ${roundId}`);

  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
