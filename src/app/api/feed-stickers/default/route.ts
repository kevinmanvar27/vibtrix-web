import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// Special ID for the default feed sticker
const DEFAULT_FEED_STICKER_ID = "default-feed";

// Helper function to ensure the feed competition exists
async function ensureFeedCompetitionExists() {
  try {
    // Check if the feed competition already exists
    const existingCompetition = await prisma.competition.findUnique({
      where: { id: "feed" },
    });

    if (!existingCompetition) {
      // Create the special "feed" competition
      await prisma.competition.create({
        data: {
          id: "feed",
          title: "Feed Stickers",
          description: "Special competition for feed stickers",
          isActive: true,
        },
      });
      debug.log("Created feed competition for stickers");
    }
  } catch (error) {
    debug.error("Error ensuring feed competition exists:", error);
    throw error;
  }
}

// GET /api/feed-stickers/default
// Get the default feed sticker
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the "feed" competition exists
    await ensureFeedCompetitionExists();

    // Get the default feed sticker
    const sticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId: "feed",
        id: DEFAULT_FEED_STICKER_ID,
      },
    });

    // Return 200 with null sticker if not found (not 404)
    return Response.json({ sticker: sticker || null });
  } catch (error) {
    debug.error("Error getting default feed sticker:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/feed-stickers/default
// Create the default feed sticker
export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, imageUrl, position, isActive } = await req.json();

    // Validate required fields
    if (!title || !imageUrl || !position) {
      return Response.json(
        { error: "Title, imageUrl, and position are required" },
        { status: 400 }
      );
    }

    // Validate position
    if (!Object.values(StickerPosition).includes(position as StickerPosition)) {
      return Response.json({ error: "Invalid position" }, { status: 400 });
    }

    // Check if default sticker already exists
    const existingSticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId: "feed",
        id: DEFAULT_FEED_STICKER_ID,
      },
    });

    if (existingSticker) {
      return Response.json(
        { error: "Default feed sticker already exists. Use PATCH to update it." },
        { status: 400 }
      );
    }

    // Ensure the "feed" competition exists
    await ensureFeedCompetitionExists();

    // Create the default feed sticker
    const sticker = await prisma.promotionSticker.create({
      data: {
        id: DEFAULT_FEED_STICKER_ID,
        title,
        imageUrl,
        position: position as StickerPosition,
        limit: null, // Default sticker has no limit
        isActive: isActive !== undefined ? isActive : true,
        competitionId: "feed", // Special ID for feed stickers
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error creating default feed sticker:", error);
    return Response.json(
      { error: "Failed to create default feed sticker" },
      { status: 500 }
    );
  }
}
