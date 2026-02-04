import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * Unified API endpoint to manage competition entries
 * This replaces multiple separate endpoints with overlapping functionality:
 * - fix-all-entries
 * - fix-entries
 * - sync-entries
 * - rebuild-entries
 * - fix-feed-visibility
 * - fix-feed-visibility-v2
 * - sync-round-entries
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const { user } = await validateRequest();
    const { action } = await req.json();

    // Check authorization
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin-only actions
    const adminOnlyActions = [
      "fix-feed-visibility",
      "fix-feed-visibility-v2",
      "process-qualification",
    ];

    if (adminOnlyActions.includes(action) && !user.isAdmin) {
      return Response.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get the competition with all its details
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
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get all entries for this competition
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        round: {
          competitionId,
        },
        postId: {
          not: null,
        },
      },
      include: {
        round: true,
        post: {
          include: {
            user: true,
          },
        },
        participant: true,
      },
    });

    // Handle different actions
    switch (action) {
      case "sync-entries":
        return handleSyncEntries(competition, entries);
      
      case "fix-all-entries":
        return handleFixAllEntries(competition, entries);
      
      case "fix-feed-visibility":
        return handleFixFeedVisibility(competition, entries);
      
      case "fix-feed-visibility-v2":
        return handleFixFeedVisibilityV2(competition, entries);
      
      case "rebuild-entries":
        return handleRebuildEntries(competition, entries);
      
      default:
        return Response.json(
          { error: "Invalid action specified" },
          { status: 400 }
        );
    }
  } catch (error) {
    debug.error("Error managing competition entries:", error);
    return Response.json(
      {
        error: "Failed to manage competition entries",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Synchronize entries based on round start dates
 */
async function handleSyncEntries(competition: any, entries: any[]) {
  const currentDate = new Date();
  const updateResults = await Promise.all(entries.map(async (entry) => {
    // Check if the round has started
    const roundStarted = new Date(entry.round.startDate) <= currentDate;

    // Update the entry with appropriate visibility
    return prisma.competitionRoundEntry.update({
      where: { id: entry.id },
      data: {
        visibleInCompetitionFeed: roundStarted,
        visibleInNormalFeed: roundStarted,
        updatedAt: new Date(),
      },
    });
  }));

  return Response.json({
    success: true,
    message: `Successfully synchronized ${updateResults.length} entries`,
    entriesUpdated: updateResults.length,
  });
}

/**
 * Fix all entries by making them visible in both feeds
 */
async function handleFixAllEntries(competition: any, entries: any[]) {
  const updateResults = await Promise.all(entries.map(async (entry: any) => {
    try {
      // Always make entries visible regardless of round start date
      const updatedEntry = await prisma.competitionRoundEntry.update({
        where: { id: entry.id },
        data: {
          visibleInCompetitionFeed: true,
          visibleInNormalFeed: true,
          updatedAt: new Date(),
        },
      });

      return {
        entryId: entry.id,
        roundId: entry.roundId,
        roundName: entry.round.name,
        postId: entry.postId,
        username: entry.post?.user.username,
        status: "fixed",
      };
    } catch (error) {
      debug.error(`Error updating entry ${entry.id}:`, error);
      return {
        entryId: entry.id,
        roundId: entry.roundId,
        roundName: entry.round.name,
        postId: entry.postId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));

  // Force refresh the competition cache
  await prisma.competition.update({
    where: { id: competition.id },
    data: {
      updatedAt: new Date(),
    },
  });

  const successCount = updateResults.filter(r => r.status === "fixed").length;
  const errorCount = updateResults.filter(r => r.status === "error").length;

  return Response.json({
    success: true,
    message: `Successfully fixed ${successCount} entries, ${errorCount} errors`,
    results: updateResults,
  });
}

/**
 * Fix feed visibility for entries from disqualified participants
 */
async function handleFixFeedVisibility(competition: any, entries: any[]) {
  // Group entries by participant
  const entriesByParticipant = new Map();
  entries.forEach((entry: any) => {
    if (!entriesByParticipant.has(entry.participantId)) {
      entriesByParticipant.set(entry.participantId, []);
    }
    entriesByParticipant.get(entry.participantId).push(entry);
  });

  const results = [];

  // Process each participant's entries
  for (const [participantId, participantEntries] of entriesByParticipant.entries()) {
    // Sort entries by round start date
    participantEntries.sort((a: any, b: any) => 
      new Date(a.round.startDate).getTime() - new Date(b.round.startDate).getTime()
    );

    // Check if participant is disqualified
    const isDisqualified = participantEntries[0]?.participant?.isDisqualified || false;

    // Process each entry
    for (let i = 0; i < participantEntries.length; i++) {
      const entry = participantEntries[i];
      
      // Entries should always be visible in normal feed
      let visibleInNormalFeed = true;
      
      // For competition feed, entries from disqualified participants should only be visible
      // for the rounds they participated in before disqualification
      let visibleInCompetitionFeed = !isDisqualified || i === 0;

      // Update the entry
      await prisma.competitionRoundEntry.update({
        where: { id: entry.id },
        data: {
          visibleInCompetitionFeed,
          visibleInNormalFeed,
          updatedAt: new Date(),
        },
      });

      results.push({
        entryId: entry.id,
        roundId: entry.roundId,
        roundName: entry.round.name,
        participantId: entry.participantId,
        isDisqualified,
        visibleInCompetitionFeed,
        visibleInNormalFeed,
      });
    }
  }

  return Response.json({
    success: true,
    message: `Successfully updated ${results.length} entries`,
    results,
  });
}

/**
 * Enhanced version of fix-feed-visibility
 */
async function handleFixFeedVisibilityV2(competition: any, entries: any[]) {
  // First, reset all entries to be visible in both feeds
  await prisma.competitionRoundEntry.updateMany({
    where: {
      round: {
        competitionId: competition.id,
      },
    },
    data: {
      visibleInCompetitionFeed: true,
      visibleInNormalFeed: true,
    },
  });

  // Group entries by participant
  const entriesByParticipant = new Map();
  entries.forEach((entry: any) => {
    if (!entriesByParticipant.has(entry.participantId)) {
      entriesByParticipant.set(entry.participantId, []);
    }
    entriesByParticipant.get(entry.participantId).push(entry);
  });

  const results = [];

  // Process each participant's entries
  for (const [participantId, participantEntries] of entriesByParticipant.entries()) {
    // Sort entries by round start date
    participantEntries.sort((a: any, b: any) => 
      new Date(a.round.startDate).getTime() - new Date(b.round.startDate).getTime()
    );

    // Check if participant is disqualified
    const isDisqualified = participantEntries[0]?.participant?.isDisqualified || false;

    if (isDisqualified) {
      // For disqualified participants, only show their first entry in the competition feed
      for (let i = 0; i < participantEntries.length; i++) {
        const entry = participantEntries[i];
        
        await prisma.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            visibleInCompetitionFeed: i === 0, // Only first entry visible in competition feed
            visibleInNormalFeed: true, // Always visible in normal feed
            updatedAt: new Date(),
          },
        });

        results.push({
          entryId: entry.id,
          roundId: entry.roundId,
          roundName: entry.round.name,
          participantId: entry.participantId,
          isDisqualified,
          visibleInCompetitionFeed: i === 0,
          visibleInNormalFeed: true,
        });
      }
    }
  }

  return Response.json({
    success: true,
    message: `Successfully updated visibility for entries from disqualified participants`,
    results,
  });
}

/**
 * Rebuild all entries with proper visibility settings
 */
async function handleRebuildEntries(competition: any, entries: any[]) {
  const currentDate = new Date();
  const updateResults = await Promise.all(entries.map(async (entry: any) => {
    try {
      // Determine visibility based on round start date
      const roundStarted = new Date(entry.round.startDate) <= currentDate;
      
      // Update the entry with appropriate visibility
      const updatedEntry = await prisma.competitionRoundEntry.update({
        where: { id: entry.id },
        data: {
          visibleInCompetitionFeed: roundStarted,
          visibleInNormalFeed: roundStarted,
          updatedAt: new Date(),
        },
      });

      return {
        entryId: entry.id,
        roundId: entry.roundId,
        roundName: entry.round.name,
        postId: entry.postId,
        roundStarted,
        status: "updated",
      };
    } catch (error) {
      debug.error(`Error updating entry ${entry.id}:`, error);
      return {
        entryId: entry.id,
        roundId: entry.roundId,
        roundName: entry.round.name,
        postId: entry.postId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));

  // Force refresh the competition cache
  await prisma.competition.update({
    where: { id: competition.id },
    data: {
      updatedAt: new Date(),
    },
  });

  const successCount = updateResults.filter(r => r.status === "updated").length;
  const errorCount = updateResults.filter(r => r.status === "error").length;

  return Response.json({
    success: true,
    message: `Successfully rebuilt ${successCount} entries, ${errorCount} errors`,
    results: updateResults,
  });
}
