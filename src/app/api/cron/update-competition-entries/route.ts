import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

/**
 * API endpoint to update competition entry visibility
 * This is designed to be called by a cron job to ensure entries become visible
 * when their rounds start
 */
export async function GET(req: NextRequest) {
  try {
    debug.log('GET /api/cron/update-competition-entries - Starting request');

    // Verify cron secret if provided
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      debug.log('GET /api/cron/update-competition-entries - Invalid authorization');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDate = new Date();
    debug.log(`Current date: ${currentDate.toISOString()}`);

    // Find all rounds that have started but their entries might not be visible yet
    const startedRounds = await prisma.competitionRound.findMany({
      where: {
        startDate: { lte: currentDate },
        entries: {
          some: {
            OR: [
              { visibleInCompetitionFeed: false },
              { visibleInNormalFeed: false }
            ],
            postId: { not: null }
          }
        }
      },
      include: {
        competition: {
          select: {
            title: true
          }
        }
      }
    });

    debug.log(`Found ${startedRounds.length} started rounds with invisible entries`);

    if (startedRounds.length === 0) {
      return Response.json({
        status: "success",
        message: "No entries need updating. All entries for started rounds are already visible."
      });
    }

    // Update entries for each started round
    const roundResults = [];

    for (const round of startedRounds) {
      debug.log(`Processing round ${round.name} (ID: ${round.id}); from competition "${round.competition.title}"`);

      // Find entries that need to be updated
      const entries = await prisma.competitionRoundEntry.findMany({
        where: {
          roundId: round.id,
          OR: [
            { visibleInCompetitionFeed: false },
            { visibleInNormalFeed: false }
          ],
          postId: { not: null }
        },
        include: {
          post: {
            select: {
              id: true,
              user: {
                select: {
                  username: true
                }
              }
            }
          },
          participant: true // Include participant information for qualification checks
        }
      });

      debug.log(`Found ${entries.length} entries to update for round ${round.name}`);

      // Update entries
      const updateResults = await Promise.all(entries.map(async (entry) => {
        try {
          // Always make entries visible in normal feed, but respect qualification status for competition feed
          // Check if the user was disqualified in a previous round
          let visibleInCompetitionFeed = true;

          // If this is not the first round, check qualification status
          const round = await prisma.competitionRound.findUnique({
            where: { id: entry.roundId },
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

          if (round) {
            const roundIndex = round.competition.rounds.findIndex(r => r.id === entry.roundId);

            // If this is not the first round, check previous rounds for disqualification
            if (roundIndex > 0) {
              // Get the previous round
              const previousRound = round.competition.rounds[roundIndex - 1];

              // Check if the user was disqualified in the previous round
              const previousRoundEntry = await prisma.competitionRoundEntry.findFirst({
                where: {
                  participantId: entry.participantId,
                  roundId: previousRound.id,
                  qualifiedForNextRound: false,
                },
              });

              // If the user was disqualified in the previous round, don't show in competition feed
              if (previousRoundEntry) {
                visibleInCompetitionFeed = false;
                debug.log(`Entry ${entry.id} belongs to a disqualified participant, only visible in normal feed`);
              }
            }
          }

          const updatedEntry = await prisma.competitionRoundEntry.update({
            where: { id: entry.id },
            data: {
              visibleInCompetitionFeed,
              visibleInNormalFeed: true, // Always visible in normal feed
              updatedAt: new Date()
            }
          });

          debug.log(`Updated entry ${entry.id} visibility: visibleInNormalFeed=true, visibleInCompetitionFeed=${visibleInCompetitionFeed}`);

          return {
            entryId: entry.id,
            postId: entry.postId,
            username: entry.post?.user?.username || 'Unknown',
            status: "updated"
          };
        } catch (error) {
          debug.error(`Error updating entry ${entry.id}:`, error);
          return {
            entryId: entry.id,
            status: "error",
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }));

      const successCount = updateResults.filter(r => r.status === "updated").length;
      const errorCount = updateResults.filter(r => r.status === "error").length;

      roundResults.push({
        roundId: round.id,
        roundName: round.name,
        competitionTitle: round.competition.title,
        entriesUpdated: successCount,
        entriesWithErrors: errorCount
      });
    }

    return Response.json({
      status: "success",
      message: `Updated visibility for entries in ${roundResults.length} rounds`,
      rounds: roundResults
    });
  } catch (error) {
    debug.error('Error updating competition entries:', error);
    return Response.json({
      status: "error",
      message: "Failed to update competition entries",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
