"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import debug from "@/lib/debug";

/**
 * Server action to synchronize round entries
 * This ensures all entries are properly visible based on round start dates
 */
export async function syncRoundEntries(competitionId: string) {
  try {
    debug.log(`Synchronizing round entries for competition ${competitionId}`);

    const currentDate = new Date();
    
    // Find all rounds that have started but their entries might not be visible yet
    const startedRounds = await prisma.competitionRound.findMany({
      where: {
        competitionId,
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
      return {
        status: "success",
        message: "No entries need updating. All entries for started rounds are already visible."
      };
    }

    // Update entries for each started round
    const roundResults = [];
    let totalUpdated = 0;

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
        }
      });

      debug.log(`Found ${entries.length} entries to update for round ${round.name}`);

      // Update entries
      const updatePromises = entries.map(entry => 
        prisma.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            visibleInCompetitionFeed: true,
            visibleInNormalFeed: true,
            updatedAt: new Date()
          }
        })
      );

      const updatedEntries = await Promise.all(updatePromises);
      totalUpdated += updatedEntries.length;

      roundResults.push({
        roundId: round.id,
        roundName: round.name,
        entriesUpdated: updatedEntries.length
      });
    }

    // Revalidate the competition page and feed
    revalidatePath(`/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}/sync-round-entries`);

    return {
      status: "success",
      message: `Updated visibility for ${totalUpdated} entries across ${roundResults.length} rounds`,
      rounds: roundResults
    };
  } catch (error) {
    debug.error("Error synchronizing round entries:", error);
    throw error;
  }
}
