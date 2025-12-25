import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/feed-stickers-setting
// Get the feed stickers setting for a specific competition
export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { competitionId } = params;
    debug.log(`API: /api/competitions/${competitionId}/feed-stickers-setting endpoint called`);

    // Get the competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        showFeedStickers: true,
        isActive: true,
      },
    });

    if (!competition) {
      debug.log(`API: Competition not found: ${competitionId}`);
      return Response.json({ showFeedStickers: false }, { status: 404 });
    }

    // Check if there are any stickers for this competition
    const stickersCount = await prisma.promotionSticker.count({
      where: {
        competitionId,
        isActive: true,
      },
    });

    const hasStickers = stickersCount > 0;

    debug.log(`API: Competition feed stickers setting: ${competition.showFeedStickers}, has stickers: ${hasStickers}, is active: ${competition.isActive}`);

    return Response.json({
      showFeedStickers: competition.showFeedStickers,
    });
  } catch (error) {
    debug.error("Error getting competition feed stickers setting:", error);
    return Response.json({ showFeedStickers: false }, { status: 500 });
  }
}
