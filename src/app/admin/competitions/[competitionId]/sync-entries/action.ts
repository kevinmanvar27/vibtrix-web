"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import debug from "@/lib/debug";

/**
 * Server action to synchronize competition entries
 * This ensures all entries are properly visible in both competition and normal feeds
 */
export async function syncCompetitionEntries(competitionId: string) {
  try {
    debug.log(`Synchronizing entries for competition ${competitionId}`);

    // Get the competition with its rounds
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!competition) {
      throw new Error("Competition not found");
    }

    // Get all entries for this competition
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        round: {
          competitionId,
        },
        postId: { not: null },
      },
      include: {
        round: true,
        participant: true,
      },
    });

    debug.log(`Found ${entries.length} entries to process`);

    const currentDate = new Date();
    let entriesUpdated = 0;

    // Process each entry
    for (const entry of entries) {
      const roundStarted = entry.round.startDate <= currentDate;
      
      // Determine if the entry should be visible in the competition feed
      // An entry should be visible in the competition feed if:
      // 1. The round has started
      // 2. The participant is qualified for this round
      let visibleInCompetitionFeed = roundStarted;

      // Determine if the entry should be visible in the normal feed
      // An entry should be visible in the normal feed if:
      // 1. The round has started
      let visibleInNormalFeed = roundStarted;

      // Check if the entry needs to be updated
      if (
        entry.visibleInCompetitionFeed !== visibleInCompetitionFeed ||
        entry.visibleInNormalFeed !== visibleInNormalFeed
      ) {
        await prisma.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            visibleInCompetitionFeed,
            visibleInNormalFeed,
            updatedAt: new Date(),
          },
        });

        entriesUpdated++;
      }
    }

    // Revalidate the competition page and feed
    revalidatePath(`/competitions/${competitionId}`);
    revalidatePath(`/admin/competitions/${competitionId}`);

    return {
      message: `Successfully synchronized ${entriesUpdated} entries`,
      entriesUpdated,
    };
  } catch (error) {
    debug.error("Error synchronizing competition entries:", error);
    throw error;
  }
}
