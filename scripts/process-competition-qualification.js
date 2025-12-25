// This script manually processes qualification for a competition round
// Usage: node scripts/process-competition-qualification.js <competitionId> <roundId>

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID and round ID from command line arguments
    const competitionId = process.argv[2];
    const roundId = process.argv[3];

    if (!competitionId || !roundId) {
      console.error("Error: Competition ID and Round ID are required");
      console.log(
        "Usage: node scripts/process-competition-qualification.js <competitionId> <roundId>",
      );
      process.exit(1);
    }

    console.log(
      `Processing qualification for competition: ${competitionId}, round: ${roundId}`,
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

    // Check if the round exists
    const round = await prisma.competitionRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      console.error(`Error: Round with ID ${roundId} not found`);
      process.exit(1);
    }

    console.log(
      `Found round: "${round.name}" with likesToPass: ${round.likesToPass || "Not set"}`,
    );

    // If likesToPass is not set, ask for confirmation
    if (round.likesToPass === null) {
      console.log(
        "Warning: likesToPass is not set for this round. Using default value of 0.",
      );
    }

    const likesToPass = round.likesToPass || 0;

    // Find the next round (if any)
    const roundIndex = competition.rounds.findIndex((r) => r.id === roundId);
    const nextRound =
      roundIndex < competition.rounds.length - 1
        ? competition.rounds[roundIndex + 1]
        : null;

    if (nextRound) {
      console.log(`Next round: "${nextRound.name}"`);
    } else {
      console.log("This is the last round.");
    }

    // Get all entries for this round
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        roundId,
        postId: { not: null },
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
        post: {
          include: {
            _count: {
              select: {
                likes: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${entries.length} entries with posts for this round`);

    // Process each entry
    const results = [];
    for (const entry of entries) {
      console.log(
        `\nProcessing entry for user: ${entry.participant.user.username}`,
      );

      const likesCount = entry.post._count.likes;
      const qualified = likesCount >= likesToPass;

      console.log(
        `Likes: ${likesCount}, Required: ${likesToPass}, Qualified: ${qualified ? "Yes" : "No"}`,
      );

      // Update the entry with qualification status
      // For the current round, we always keep posts visible in the competition feed
      // regardless of qualification status, as they were valid entries for this round
      const updatedEntry = await prisma.competitionRoundEntry.update({
        where: { id: entry.id },
        data: {
          qualifiedForNextRound: qualified,
          // Always keep posts visible in normal feed
          visibleInNormalFeed: true,
          // Always keep posts visible in competition feed for the current round
          visibleInCompetitionFeed: true,
        },
      });

      console.log(
        `Updated entry: qualifiedForNextRound=${qualified}, visibleInCompetitionFeed=true, visibleInNormalFeed=true`,
      );

      // If this is not the last round and the participant qualified,
      // create an entry for the next round
      if (qualified && nextRound) {
        // Check if an entry already exists for the next round
        const existingNextRoundEntry =
          await prisma.competitionRoundEntry.findUnique({
            where: {
              participantId_roundId: {
                participantId: entry.participantId,
                roundId: nextRound.id,
              },
            },
          });

        // Only create a new entry if one doesn't exist
        if (!existingNextRoundEntry) {
          const newEntry = await prisma.competitionRoundEntry.create({
            data: {
              participantId: entry.participantId,
              roundId: nextRound.id,
              // New entries for qualified participants should be visible in both feeds
              visibleInCompetitionFeed: true,
              visibleInNormalFeed: true,
            },
          });

          console.log(`Created entry for next round: ${nextRound.name}`);
        } else {
          console.log(`Entry for next round already exists`);
        }

        // Update the participant's current round
        await prisma.competitionParticipant.update({
          where: { id: entry.participantId },
          data: {
            currentRoundId: nextRound.id,
          },
        });

        console.log(
          `Updated participant's current round to: ${nextRound.name}`,
        );
      }

      results.push({
        entryId: entry.id,
        username: entry.participant.user.username,
        status: qualified ? "qualified" : "disqualified",
        likesCount,
        likesToPass,
      });
    }

    // Print results
    console.log("\nResults:");
    const qualified = results.filter((r) => r.status === "qualified");
    const disqualified = results.filter((r) => r.status === "disqualified");

    console.log(`Qualified: ${qualified.length}`);
    qualified.forEach((result) => {
      console.log(`- ${result.username}: ${result.likesCount} likes`);
    });

    console.log(`\nDisqualified: ${disqualified.length}`);
    disqualified.forEach((result) => {
      console.log(
        `- ${result.username}: ${result.likesCount} likes (needed ${result.likesToPass})`,
      );
    });

    console.log("\nDone!");
  } catch (error) {
    console.error("Unhandled error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
