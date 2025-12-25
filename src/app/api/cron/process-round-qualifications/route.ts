import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

/**
 * Cron job endpoint to automatically process round qualifications
 * This ensures that when rounds end, participants are automatically evaluated
 * and competitions are terminated if no one qualifies
 */
export async function GET(req: NextRequest) {
  try {
    debug.log('GET /api/cron/process-round-qualifications - Starting request');

    // Verify cron secret if provided
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      debug.log('GET /api/cron/process-round-qualifications - Invalid authorization');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDate = new Date();
    debug.log(`Current date: ${currentDate.toISOString()}`);

    // Find all active competitions with rounds that have ended but haven't been processed
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        completionReason: null, // Only competitions that haven't been completed yet
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    debug.log(`Found ${activeCompetitions.length} active competitions to check`);

    const processedCompetitions = [];

    for (const competition of activeCompetitions) {
      debug.log(`Processing competition: ${competition.title} (ID: ${competition.id})`);

      // EXACT CONDITION: If first round end date/time < now && total participants < 1
      const firstRound = competition.rounds[0];
      if (firstRound && new Date(firstRound.endDate) < currentDate) {
        const totalParticipants = await prisma.competitionParticipant.count({
          where: {
            competitionId: competition.id,
          },
        });

        debug.log(`First round ended for competition ${competition.id}. Total participants: ${totalParticipants}`);

        if (totalParticipants < 1) {
          const completionReason = "No one joined this competition, that's why it ended.";

          await prisma.competition.update({
            where: { id: competition.id },
            data: {
              completionReason,
              isActive: false,
            },
          });

          debug.log(`Competition ${competition.id} ended - no participants joined`);

          processedCompetitions.push({
            competitionId: competition.id,
            competitionTitle: competition.title,
            roundId: firstRound.id,
            roundName: firstRound.name,
            result: completionReason,
            completionReason,
          });

          continue; // Skip processing other rounds for this competition
        }
      }

      // Find rounds that have ended but might not have been processed
      const endedRounds = competition.rounds.filter(round =>
        new Date(round.endDate) < currentDate
      );

      if (endedRounds.length === 0) {
        debug.log(`No ended rounds found for competition ${competition.id}`);
        continue;
      }

      // Process each ended round in order
      for (const round of endedRounds) {
        debug.log(`Checking round: ${round.name} (ID: ${round.id}) - ended at ${round.endDate}`);

        // Check if this round has already been processed by looking for qualification status
        const entriesWithQualificationStatus = await prisma.competitionRoundEntry.count({
          where: {
            roundId: round.id,
            postId: { not: null },
            qualifiedForNextRound: { not: null }, // Has been processed
          },
        });

        const totalEntriesWithPosts = await prisma.competitionRoundEntry.count({
          where: {
            roundId: round.id,
            postId: { not: null },
          },
        });

        // If all entries have been processed, skip this round
        if (entriesWithQualificationStatus === totalEntriesWithPosts && totalEntriesWithPosts > 0) {
          debug.log(`Round ${round.name} already processed (${entriesWithQualificationStatus}/${totalEntriesWithPosts} entries processed)`);
          continue;
        }

        debug.log(`Round ${round.name} needs processing (${entriesWithQualificationStatus}/${totalEntriesWithPosts} entries processed)`);

        // Process this round's qualification
        const result = await processRoundQualification(competition.id, round.id);
        
        if (result.success) {
          processedCompetitions.push({
            competitionId: competition.id,
            competitionTitle: competition.title,
            roundId: round.id,
            roundName: round.name,
            result: result.message,
            completionReason: result.completionReason,
          });

          // If the competition was completed, break out of the round loop
          if (result.completionReason) {
            debug.log(`Competition ${competition.id} was completed: ${result.completionReason}`);
            break;
          }
        } else {
          debug.error(`Failed to process round ${round.id}: ${result.error}`);
        }
      }
    }

    return Response.json({
      status: "success",
      message: `Processed ${processedCompetitions.length} competition rounds`,
      processedCompetitions,
    });
  } catch (error) {
    debug.error('Error processing round qualifications:', error);
    return Response.json({
      status: "error",
      message: "Failed to process round qualifications",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Process qualification for a specific round
 */
async function processRoundQualification(competitionId: string, roundId: string) {
  try {
    debug.log(`Processing qualification for competition ${competitionId}, round ${roundId}`);

    // Get the competition and round details
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
      return { success: false, error: "Competition not found" };
    }

    const round = competition.rounds.find(r => r.id === roundId);
    if (!round) {
      return { success: false, error: "Round not found" };
    }

    const roundIndex = competition.rounds.findIndex(r => r.id === roundId);
    const isLastRound = roundIndex === competition.rounds.length - 1;
    const nextRound = !isLastRound ? competition.rounds[roundIndex + 1] : null;
    const isFirstRound = roundIndex === 0;
    const likesToPass = round.likesToPass || 0;

    // Check if there are any participants in the competition at all
    const participantCount = await prisma.competitionParticipant.count({
      where: {
        competitionId,
      },
    });

    // EXACT CONDITION: If first round end date/time < now && total participants < 1
    const currentDate = new Date();
    if (isFirstRound && new Date(round.endDate) < currentDate && participantCount < 1) {
      const completionReason = "No one joined this competition, that's why it ended.";

      await prisma.competition.update({
        where: { id: competitionId },
        data: {
          completionReason,
          isActive: false,
        },
      });

      return {
        success: true,
        message: completionReason,
        completionReason
      };
    }

    // Get all entries for this round
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        roundId,
        postId: { not: null },
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
      const completionReason = isFirstRound
        ? "Competition ended: No participants submitted posts for the competition. No winner declared."
        : `Competition ended: No participants available in ${round.name}. No winner declared.`;

      await prisma.competition.update({
        where: { id: competitionId },
        data: {
          completionReason,
          isActive: false,
        },
      });

      return { 
        success: true, 
        message: completionReason,
        completionReason 
      };
    }

    // Process each entry
    const results = await Promise.all(entries.map(async (entry) => {
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
      await prisma.competitionRoundEntry.update({
        where: { id: entry.id },
        data: {
          qualifiedForNextRound: qualified,
          visibleInNormalFeed: true,
          visibleInCompetitionFeed: true,
        },
      });

      // If the participant didn't qualify, hide their entries for future rounds
      if (!qualified && nextRound) {
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
        }
      }

      // If qualified and there's a next round, create entry for next round
      if (qualified && nextRound) {
        const existingNextRoundEntry = await prisma.competitionRoundEntry.findUnique({
          where: {
            participantId_roundId: {
              participantId: entry.participantId,
              roundId: nextRound.id,
            },
          },
        });

        if (!existingNextRoundEntry) {
          await prisma.competitionRoundEntry.create({
            data: {
              participantId: entry.participantId,
              roundId: nextRound.id,
              visibleInCompetitionFeed: true,
              visibleInNormalFeed: true,
            },
          });
        }

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

    // Check if this is not the last round and if any participants qualified
    if (!isLastRound) {
      const qualifiedParticipants = results.filter(result => result.status === "qualified");

      if (qualifiedParticipants.length === 0) {
        const completionReason = isFirstRound 
          ? `Competition ended: No participants met the minimum requirements to pass the first round. No winner declared.`
          : `Competition ended: No participants qualified from ${round.name}. No winner declared.`;

        await prisma.competition.update({
          where: { id: competitionId },
          data: {
            completionReason,
            isActive: false,
          },
        });

        return { 
          success: true, 
          message: completionReason,
          completionReason 
        };
      }
    }

    return {
      success: true,
      message: `Processed ${results.length} entries for round ${round.name}`,
    };
  } catch (error) {
    debug.error("Error processing round qualification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
