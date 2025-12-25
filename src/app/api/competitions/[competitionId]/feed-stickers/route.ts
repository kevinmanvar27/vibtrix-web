import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/feed-stickers
// Get all feed stickers for a competition
export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get all feed stickers for this competition
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId,
        id: {
          not: `default-${competitionId}` // Exclude the default sticker
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({ stickers });
  } catch (error) {
    debug.error("Error getting competition feed stickers:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/competitions/[competitionId]/feed-stickers
// Create a new feed sticker for a competition
export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;
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

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Create the feed sticker
    const sticker = await prisma.promotionSticker.create({
      data: {
        title,
        imageUrl,
        position: position as StickerPosition,
        limit: limit ? parseInt(limit.toString()) : null,
        isActive: isActive !== undefined ? isActive : true,
        competitionId,
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error creating competition feed sticker:", error);
    return Response.json(
      { error: "Failed to create feed sticker" },
      { status: 500 }
    );
  }
}
