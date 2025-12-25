import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/public/competitions/[competitionId]/feed-stickers
// Get all feed stickers for a competition - public endpoint accessible to all users
export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { competitionId } = params;
    debug.log(`PUBLIC API: /api/public/competitions/${competitionId}/feed-stickers endpoint called`);

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: {
        id: competitionId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        showFeedStickers: true,
      },
    });

    if (!competition) {
      debug.log(`PUBLIC API: Competition not found: ${competitionId}`);
      return Response.json({
        stickers: [],
        defaultSticker: null,
        error: "Competition not found"
      }, { status: 404 });
    }

    // Log whether feed stickers are enabled for this competition
    debug.log(`PUBLIC API: Competition ${competitionId} has feed stickers ${competition.showFeedStickers ? 'enabled' : 'disabled'}`);

    // We'll still return stickers even if showFeedStickers is false
    // The client will decide whether to display them based on the setting

    // Get all active feed stickers for this competition
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId,
        isActive: true,
        id: {
          not: `default-${competitionId}` // Exclude the default sticker
        }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        position: true,
        limit: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    debug.log(`PUBLIC API: Found ${stickers.length} competition feed stickers`);

    // Get the default feed sticker for this competition
    const defaultSticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId,
        id: `default-${competitionId}`,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        position: true,
        isActive: true,
      },
    });

    debug.log(`PUBLIC API: Default competition sticker found: ${defaultSticker ? 'Yes' : 'No'}`);

    return Response.json({
      stickers,
      defaultSticker
    });
  } catch (error) {
    debug.error("Error getting public competition feed stickers:", error);
    return Response.json({
      stickers: [],
      defaultSticker: null,
      error: "Failed to fetch stickers"
    }, { status: 500 });
  }
}
