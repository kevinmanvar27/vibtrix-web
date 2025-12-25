import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/media-display-setting
// Get the media display setting for a specific competition
export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { competitionId } = params;
    debug.log(`API: /api/competitions/${competitionId}/media-display-setting endpoint called`);

    // Get the competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        showStickeredMedia: true,
        isActive: true,
      },
    });

    if (!competition) {
      debug.log(`API: Competition not found: ${competitionId}`);
      return Response.json({ showStickeredMedia: false }, { status: 404 });
    }

    debug.log(`API: Competition media display setting: ${competition.showStickeredMedia}, is active: ${competition.isActive}`);

    return Response.json({
      showStickeredMedia: competition.showStickeredMedia,
    });
  } catch (error) {
    debug.error("Error getting competition media display setting:", error);
    return Response.json({ showStickeredMedia: false }, { status: 500 });
  }
}
