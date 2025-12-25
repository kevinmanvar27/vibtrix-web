import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

// Special ID for the default feed sticker
const DEFAULT_FEED_STICKER_ID = "default-feed";

// GET /api/public/feed-stickers
// Get all feed stickers - public endpoint accessible to all users
export async function GET() {
  try {
    // Get all active feed stickers
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId: "feed", // Special ID for feed stickers
        isActive: true,
        id: {
          not: DEFAULT_FEED_STICKER_ID // Exclude the default sticker
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

    // Get the default feed sticker
    const defaultSticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId: "feed",
        id: DEFAULT_FEED_STICKER_ID,
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

    return Response.json({
      stickers,
      defaultSticker
    });
  } catch (error) {
    debug.error("Error getting public feed stickers:", error);
    return Response.json({
      stickers: [],
      defaultSticker: null,
      error: "Failed to fetch stickers"
    }, { status: 500 });
  }
}
