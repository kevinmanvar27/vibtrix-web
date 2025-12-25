import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { competitionId } = params;
    const { roundId } = await req.json();

    if (!roundId) {
      return Response.json({ error: "Round ID is required" }, { status: 400 });
    }

    // Check if the competition exists
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
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Check if the round exists and belongs to this competition
    const round = await prisma.competitionRound.findUnique({
      where: {
        id: roundId,
        competitionId,
      },
    });

    if (!round) {
      return Response.json({ error: "Round not found" }, { status: 404 });
    }

    // Check if the round has ended
    const currentDate = new Date();
    if (new Date(round.endDate) > currentDate) {
      return Response.json({
        error: "Cannot process qualification before the round has ended"
      }, { status: 400 });
    }

    // Get the minimum likes required to pass this round
    const likesToPass = round.likesToPass || 0;

    // Find the next round (if any)
    const roundIndex = competition.rounds.findIndex(r => r.id === roundId);
    const isLastRound = roundIndex === competition.rounds.length - 1;
    const nextRound = !isLastRound ? competition.rounds[roundIndex + 1] : null;
    const isFirstRound = roundIndex === 0;

    // First, check if there are any participants in the competition at all
    const participantCount = await prisma.competitionParticipant.count({
      where: {
        competitionId,
      },
    });

    // EXACT CONDITION: If first round end date/time < now && total participants < 1
    if (isFirstRound && new Date(round.endDate) < currentDate && participantCount < 1) {
      const completionReason = "No one joined this competition, that's why it ended.";

      // Mark the competition as completed
      await prisma.competition.update({
        where: { id: competitionId },
        data: {
          completionReason,
          isActive: false, // Mark competition as inactive
        },
      });

      debug.log(`Competition ${competitionId} ended - no participants joined`);

      return Response.json({
        success: true,
        message: completionReason,
        completionReason,
      });
    }

    // Get all entries for this round
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        roundId,
        postId: { not: null }, // Only entries with posts
      },
      include: {
        post: {
          include: {
            _count: {
              select: {
                likes: true,
              },
            },
          },
        },
        participant: true,
      },
    });

    // Check if there are no participants with posts in this round
    if (entries.length === 0) {
      // For the first round, use a specific message about no participants submitting posts
      const completionReason = isFirstRound
        ? "Competition ended: No participants submitted posts for the competition. No winner declared."
        : `Competition ended: No participants available in ${round.name}. No winner declared.`;

      // Mark the competition as completed with the appropriate reason
      await prisma.competition.update({
        where: { id: competitionId },
        data: {
          completionReason,
          isActive: false, // Mark competition as inactive
        },
      });

      debug.log(`Competition ${competitionId} marked as completed due to no participants with posts in round ${round.name}`);

      return Response.json({
        success: true,
        message: completionReason,
        completionReason,
      });
    }

    // Process each entry
    const results = await Promise.all(entries.map(async (entry) => {
      // Skip entries without posts
      if (!entry.post) {
        return {
          entryId: entry.id,
          status: "skipped",
          reason: "No post found",
        };
      }

      const likesCount = entry.post._count.likes;
      const qualified = likesCount >= likesToPass;

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

      // If the participant didn't qualify, we need to hide their entries for future rounds
      // from the competition feed
      if (!qualified && nextRound) {
        // Find all entries for this participant in future rounds
        const futureRoundEntries = await prisma.competitionRoundEntry.findMany({
          where: {
            participantId: entry.participantId,
            round: {
              competitionId,
              startDate: {
                gt: round.startDate,
              },
            },
          },
        });

        // Update all future entries to be hidden from the competition feed
        if (futureRoundEntries.length > 0) {
          await prisma.competitionRoundEntry.updateMany({
            where: {
              id: {
                in: futureRoundEntries.map(e => e.id),
              },
            },
            data: {
              visibleInCompetitionFeed: false,
            },
          });

          debug.log(`Updated ${futureRoundEntries.length} future entries to be hidden from the competition feed for disqualified participant ${entry.participantId}`);
        }
      }

      // If this is not the last round and the participant qualified,
      // create an entry for the next round
      if (qualified && nextRound) {
        // Check if an entry already exists for the next round
        const existingNextRoundEntry = await prisma.competitionRoundEntry.findUnique({
          where: {
            participantId_roundId: {
              participantId: entry.participantId,
              roundId: nextRound.id,
            },
          },
        });

        // Only create a new entry if one doesn't exist
        if (!existingNextRoundEntry) {
          await prisma.competitionRoundEntry.create({
            data: {
              participantId: entry.participantId,
              roundId: nextRound.id,
              // New entries for qualified participants should be visible in both feeds
              visibleInCompetitionFeed: true,
              visibleInNormalFeed: true,
            },
          });
        }

        // Update the participant's current round
        await prisma.competitionParticipant.update({
          where: { id: entry.participantId },
          data: {
            currentRoundId: nextRound.id,
          },
        });
      }

      return {
        entryId: entry.id,
        status: qualified ? "qualified" : "disqualified",
        likesCount,
        likesToPass,
      };
    }));

    // Check if this is not the last round and if any participants qualified for the next round
    if (!isLastRound) {
      const qualifiedParticipants = results.filter(result => result.status === "qualified");

      // If no participants qualified for the next round, mark the competition as completed
      if (qualifiedParticipants.length === 0) {
        const completionReason = isFirstRound
          ? `Competition ended: No participants met the minimum requirements to pass the first round. No winner declared.`
          : `Competition ended: No participants qualified from ${round.name}. No winner declared.`;

        await prisma.competition.update({
          where: { id: competitionId },
          data: {
            completionReason,
            isActive: false, // Mark competition as inactive
          },
        });

        debug.log(`Competition ${competitionId} marked as completed due to no participants qualifying from ${round.name}`);

        return Response.json({
          success: true,
          message: completionReason,
          completionReason,
          results,
        });
      }
    }

    return Response.json({
      success: true,
      message: `Processed ${results.length} entries for round ${round.name}`,
      results,
    });
  } catch (error) {
    debug.error("Error processing qualification:", error);
    return Response.json(
      { error: "Failed to process qualification", details: String(error) },
      { status: 500 }
    );
  }
}
