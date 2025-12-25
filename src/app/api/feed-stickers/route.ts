import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/feed-stickers
// Get all feed stickers
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the "feed" competition exists
    await ensureFeedCompetitionExists();

    // Get all feed stickers
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId: "feed", // Special ID for feed stickers
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({ stickers });
  } catch (error) {
    debug.error("Error getting feed stickers:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/feed-stickers
// Create a new feed sticker
export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, imageUrl, position, limit, isActive } = await req.json();

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

    // Ensure the "feed" competition exists
    await ensureFeedCompetitionExists();

    // Create the feed sticker
    const sticker = await prisma.promotionSticker.create({
      data: {
        title,
        imageUrl,
        position: position as StickerPosition,
        limit: limit ? parseInt(limit.toString()) : null,
        isActive: isActive !== undefined ? isActive : true,
        competitionId: "feed", // Special ID for feed stickers
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error creating feed sticker:", error);
    return Response.json(
      { error: "Failed to create feed sticker" },
      { status: 500 }
    );
  }
}

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
