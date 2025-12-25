// This script manually sets a user as a winner for a competition
// Usage: node scripts/set-competition-winner.js <competitionId> <username> <position>

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID, username, and position from command line arguments
    const competitionId = process.argv[2];
    const username = process.argv[3];
    const position = parseInt(process.argv[4]);

    if (
      !competitionId ||
      !username ||
      isNaN(position) ||
      position < 1 ||
      position > 3
    ) {
      console.error(
        "Error: Competition ID, username, and position (1-3) are required",
      );
      console.log(
        "Usage: node scripts/set-competition-winner.js <competitionId> <username> <position>",
      );
      process.exit(1);
    }

    console.log(
      `Setting user ${username} as position ${position} winner for competition: ${competitionId}`,
    );

    // Check if the competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!competition) {
      console.error(`Error: Competition with ID ${competitionId} not found`);
      process.exit(1);
    }

    console.log(
      `Found competition: "${competition.title}" with ${competition.rounds.length} rounds`,
    );

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      console.error(`Error: User with username ${username} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (ID: ${user.id})`);

    // Find the participant
    const participant = await prisma.competitionParticipant.findFirst({
      where: {
        competitionId,
        userId: user.id,
      },
    });

    if (!participant) {
      console.error(
        `Error: User ${username} is not a participant in this competition`,
      );
      process.exit(1);
    }

    console.log(`Found participant with ID: ${participant.id}`);

    // Get the last round of the competition
    const lastRound = competition.rounds[competition.rounds.length - 1];
    console.log(`Last round: "${lastRound.name}"`);

    // Find the entry for the last round
    let entry = await prisma.competitionRoundEntry.findFirst({
      where: {
        participantId: participant.id,
        roundId: lastRound.id,
      },
      include: {
        post: true,
      },
    });

    // If the user doesn't have an entry in the final round, create one
    if (!entry) {
      console.log(
        `User ${username} does not have an entry in the final round. Creating one...`,
      );

      entry = await prisma.competitionRoundEntry.create({
        data: {
          participantId: participant.id,
          roundId: lastRound.id,
          visibleInNormalFeed: true,
          visibleInCompetitionFeed: true,
        },
        include: {
          post: true,
        },
      });

      console.log(`Created entry with ID: ${entry.id}`);
    }
    // If the user has an entry but no post, we can still set them as a winner
    else if (!entry.post) {
      console.log(
        `User ${username} has an entry but no post in the final round`,
      );
    }
    // If the user has an entry with a post, get the likes count
    else {
      console.log(`Found entry with post ID: ${entry.post.id}`);

      // Get the likes count for the post
      const likesCount = await prisma.like.count({
        where: {
          postId: entry.post.id,
        },
      });

      console.log(`Post has ${likesCount} likes`);
    }

    // Update the entry with the winner position
    await prisma.competitionRoundEntry.update({
      where: { id: entry.id },
      data: {
        winnerPosition: position,
      },
    });

    console.log(`Updated entry with winner position: ${position}`);

    // Update the competition's updatedAt timestamp to trigger a refresh
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        updatedAt: new Date(),
      },
    });

    console.log(`Updated competition with new timestamp`);

    // Check if there's a prize for this position
    const prizePosition =
      position === 1 ? "FIRST" : position === 2 ? "SECOND" : "THIRD";

    const prize = await prisma.competitionPrize.findFirst({
      where: {
        competitionId,
        position: prizePosition,
      },
    });

    if (prize) {
      console.log(
        `Found prize for position ${position}: ${prize.amount} ${prize.currency}`,
      );

      // Check if there's already a prize payment for this user and prize
      const existingPayment = await prisma.prizePayment.findFirst({
        where: {
          userId: user.id,
          prizeId: prize.id,
        },
      });

      if (!existingPayment) {
        // Create a prize payment record
        await prisma.prizePayment.create({
          data: {
            userId: user.id,
            prizeId: prize.id,
            competitionId,
            status: "PENDING",
            amount: prize.amount,
            currency: prize.currency,
          },
        });

        console.log(`Created prize payment record for user ${username}`);
      } else {
        console.log(`Prize payment record already exists for user ${username}`);
      }
    } else {
      console.log(`No prize found for position ${position}`);
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("Unhandled error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
