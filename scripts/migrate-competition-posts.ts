import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCompetitionPosts() {
  console.log('Starting migration of competition posts to round-specific entries...');

  try {
    // Get all competition participants with postIds
    const participants = await prisma.competitionParticipant.findMany({
      include: {
        competition: {
          include: {
            rounds: {
              orderBy: {
                startDate: 'asc',
              },
            },
          },
        },
      },
    });

    console.log(`Found ${participants.length} competition participants to process`);

    for (const participant of participants) {
      // Skip if no rounds or no posts
      if (!participant.competition.rounds.length) {
        console.log(`Skipping participant ${participant.id} - competition has no rounds`);
        continue;
      }

      // Get the first round of the competition
      const firstRound = participant.competition.rounds[0];

      // Create round entry for the first round with the existing post
      if ((participant as any).postIds?.length) {
        const postIds = (participant as any).postIds as string[];
        
        for (const postId of postIds) {
          // Check if post exists
          const post = await prisma.post.findUnique({
            where: { id: postId },
          });

          if (post) {
            // Create round entry
            await prisma.competitionRoundEntry.create({
              data: {
                participantId: participant.id,
                roundId: firstRound.id,
                postId: postId,
              },
            });
            console.log(`Created round entry for participant ${participant.id}, round ${firstRound.id}, post ${postId}`);
          } else {
            console.log(`Skipping non-existent post ${postId} for participant ${participant.id}`);
          }
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateCompetitionPosts()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
