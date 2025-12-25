/**
 * API route for fetching competitions
 * Supports filtering by status (active, upcoming, past, all)
 */
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * GET handler for competitions
 * Returns a list of competitions filtered by status
 */
export async function GET(req: NextRequest) {
  try {
    // Check if the database is connected before proceeding
    try {
      await prisma.$queryRaw`SELECT 1`;
      // Database connection verified
    } catch (dbError) {
      // Handle database connection error
      return Response.json(
        { error: "Database connection error", details: String(dbError) },
        { status: 503 }
      );
    }

    // We'll still validate the request, but we won't require authentication
    let user = null;
    try {
      const result = await validateRequest();
      user = result.user;
      // User authentication successful
    } catch (authError) {
      // Authentication failed, but we'll continue as competitions are public
    }

    // Get query parameters
    const status = req.nextUrl.searchParams.get("status") || "active";
    // Fetch competitions based on status parameter

    // Define the where clause based on status
    let whereClause: any = {};

    if (status === "active") {
      // Active competitions are those that are marked as active and have at least one round
      // that has started, and the last round has not ended yet
      whereClause = {
        isActive: true,
        AND: [
          {
            // At least one round has started
            rounds: {
              some: {
                startDate: { lte: new Date() },
              },
            },
          },
          {
            // The last round has not ended yet
            rounds: {
              some: {
                endDate: { gte: new Date() },
              },
            },
          },
        ],
      };
    } else if (status === "upcoming") {
      // Upcoming competitions are those that are marked as active but haven't started yet
      // (all rounds have start dates in the future)
      whereClause = {
        isActive: true,
        rounds: {
          every: {
            startDate: { gt: new Date() },
          },
        },
      };
    } else if (status === "past") {
      // Past competitions are those where all rounds have ended
      // Only show competitions that are active (isActive: true)
      // AND ensure they don't qualify as upcoming competitions
      whereClause = {
        isActive: true,
        rounds: {
          every: {
            endDate: { lt: new Date() },
          },
        },
        // Make sure at least one round exists
        AND: [
          {
            rounds: {
              some: {}
            }
          }
        ],
        // Make sure it's not an upcoming competition (at least one round has started)
        NOT: {
          rounds: {
            every: {
              startDate: { gt: new Date() },
            },
          },
        },
      };
    } else if (status === "all") {
      // No additional filters for "all"
      whereClause = {};
    }

    // CHECK AND TERMINATE COMPETITIONS FIRST
    const currentTime = new Date();

    // Find competitions that need to be checked
    const competitionsToCheck = await prisma.competition.findMany({
      where: {
        isActive: true,
        completionReason: null,
      },
      select: {
        id: true,
        title: true,
        rounds: {
          orderBy: { startDate: 'asc' },
          select: {
            id: true,
            name: true,
            endDate: true,
            likesToPass: true,
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    // Check each competition for termination conditions
    for (const comp of competitionsToCheck) {
      let competitionTerminated = false;

      // CONDITION 1: first_round_end_date_time < current_time && total_participants < 1
      const firstRound = comp.rounds[0];
      if (firstRound) {
        const firstRoundEnded = new Date(firstRound.endDate) < currentTime;
        const participantCount = comp._count.participants;

        if (firstRoundEnded && participantCount < 1) {
          debug.log(`Terminating competition ${comp.id} from list API - no participants joined`);

          await prisma.competition.update({
            where: { id: comp.id },
            data: {
              completionReason: "No one joined this competition, that's why it ended.",
              isActive: false,
            },
          });

          // Make all competition posts visible in normal feed
          await prisma.competitionRoundEntry.updateMany({
            where: {
              round: {
                competitionId: comp.id,
              },
              postId: { not: null },
            },
            data: {
              visibleInNormalFeed: true,
            },
          });

          competitionTerminated = true;
        }
      }

      // CONDITION 2: round_end_date_time < current_time && participants > 0 && no_participant_got_required_likes
      if (!competitionTerminated) {
        for (const round of comp.rounds) {
          const roundEnded = new Date(round.endDate) < currentTime;
          const likesToPass = round.likesToPass || 0;

          if (roundEnded && likesToPass > 0) {
            // Check if any participant got required likes in this round
            const entriesWithPosts = await prisma.competitionRoundEntry.findMany({
              where: {
                roundId: round.id,
                postId: { not: null }
              },
              include: {
                post: {
                  include: {
                    _count: {
                      select: { likes: true }
                    }
                  }
                }
              }
            });

            const entriesWithRequiredLikes = entriesWithPosts.filter(entry =>
              entry.post && entry.post._count.likes >= likesToPass
            ).length;

            const totalEntriesInRound = entriesWithPosts.length;

            debug.log(`List API - Round ${round.name} check: ended=${roundEnded}, totalEntries=${totalEntriesInRound}, entriesWithRequiredLikes=${entriesWithRequiredLikes}, likesToPass=${likesToPass}`);

            // If round ended, has entries, but no one got required likes
            if (totalEntriesInRound > 0 && entriesWithRequiredLikes === 0) {
              debug.log(`Terminating competition ${comp.id} from list API - no participants got required likes in ${round.name}`);

              const completionReason = `${round.name} required ${likesToPass} likes but no participant achieved this target, so the competition has been ended.`;

              await prisma.competition.update({
                where: { id: comp.id },
                data: {
                  completionReason,
                  isActive: false,
                },
              });

              // Make all competition posts visible in normal feed
              await prisma.competitionRoundEntry.updateMany({
                where: {
                  round: {
                    competitionId: comp.id,
                  },
                  postId: { not: null },
                },
                data: {
                  visibleInNormalFeed: true,
                },
              });

              debug.log(`Competition ${comp.id} terminated from list API successfully - no qualifying participants in ${round.name}`);
              break; // Exit the loop since competition is terminated
            }
          }
        }
      }
    }

    // Execute the query with the constructed where clause

    // Get competitions
    const competitions = await prisma.competition.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPaid: true,
        entryFee: true,
        mediaType: true,
        isActive: true,
        completionReason: true,
        hasPrizes: true,
        createdAt: true,
        updatedAt: true,
        rounds: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            likesToPass: true,
            createdAt: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        },
        _count: {
          select: {
            participants: true,
            prizes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter out duplicate rounds by name for each competition
    const competitionsWithUniqueRounds = competitions.map(competition => {
      // Create a map to store unique rounds by name
      const uniqueRoundsByName = new Map();

      // Process each round
      competition.rounds.forEach(round => {
        // If we haven't seen this round name yet, or this round is newer than the one we've seen
        if (!uniqueRoundsByName.has(round.name) ||
          new Date(round.createdAt) > new Date(uniqueRoundsByName.get(round.name).createdAt)) {
          uniqueRoundsByName.set(round.name, round);
        }
      });

      // Replace the rounds array with the filtered one
      return {
        ...competition,
        rounds: Array.from(uniqueRoundsByName.values()),
      };
    });

    debug.log(`Found ${competitionsWithUniqueRounds.length} competitions for status: ${status}`);

    // Add detailed logging for each competition
    competitionsWithUniqueRounds.forEach(comp => {
      debug.log(`Competition in ${status} tab: ${comp.id} - ${comp.title}`, {
        isActive: comp.isActive,
        roundsCount: comp.rounds.length,
        firstRoundStart: comp.rounds.length > 0 ? new Date(comp.rounds[0].startDate).toISOString() : 'N/A',
        firstRoundEnd: comp.rounds.length > 0 ? new Date(comp.rounds[0].endDate).toISOString() : 'N/A',
        allRoundsEndedBeforeNow: comp.rounds.length > 0 && comp.rounds.every(round => new Date(round.endDate) < new Date()),
        allRoundsStartAfterNow: comp.rounds.length > 0 && comp.rounds.every(round => new Date(round.startDate) > new Date())
      });
    });

    return Response.json(competitionsWithUniqueRounds);
  } catch (error) {
    debug.error("Error fetching competitions:", error);
    return Response.json(
      { error: "Failed to fetch competitions", details: String(error) },
      { status: 500 }
    );
  }
}
