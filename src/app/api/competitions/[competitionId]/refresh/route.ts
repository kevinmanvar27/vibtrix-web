import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * API endpoint to refresh competition data
 * This ensures all entries are properly synchronized after competition updates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    debug.log(`POST /api/competitions/${params.competitionId}/refresh - Starting request`);
    const { user } = await validateRequest();

    if (!user) {
      debug.log(`POST /api/competitions/${params.competitionId}/refresh - Unauthorized request`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;

    // Get the competition with its rounds
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: true,
      },
    });

    if (!competition) {
      debug.log(`POST /api/competitions/${competitionId}/refresh - Competition not found`);
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
    });

    debug.log(`Found ${entries.length} entries to refresh`);

    // Update all entries to ensure consistent visibility
    if (entries.length > 0) {
      await prisma.competitionRoundEntry.updateMany({
        where: {
          id: {
            in: entries.map(entry => entry.id)
          }
        },
        data: {
          visibleInCompetitionFeed: true,
          visibleInNormalFeed: true,
          updatedAt: new Date(),
        },
      });
      debug.log(`Refreshed ${entries.length} entries`);
    }

    // Force refresh the competition cache by touching the competition record
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        updatedAt: new Date()
      }
    });

    return Response.json({
      success: true,
      message: `Refreshed competition data with ${entries.length} entries`,
    });
  } catch (error) {
    debug.error(`POST /api/competitions/${params.competitionId}/refresh - Unhandled error:`, error);
    return Response.json(
      {
        error: "Failed to refresh competition data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
