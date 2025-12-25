import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/feed-stickers/[stickerId]
// Get a specific feed sticker for a competition
export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string; stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, stickerId } = params;

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get the feed sticker
    const sticker = await prisma.promotionSticker.findUnique({
      where: {
        id: stickerId,
        competitionId,
      },
    });

    if (!sticker) {
      return Response.json({ error: "Feed sticker not found" }, { status: 404 });
    }

    return Response.json({ sticker });
  } catch (error) {
    debug.error("Error getting competition feed sticker:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/competitions/[competitionId]/feed-stickers/[stickerId]
// Update a feed sticker for a competition
export async function PATCH(
  req: NextRequest,
  { params }: { params: { competitionId: string; stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, stickerId } = params;
    const { title, imageUrl, position, limit, isActive } = await req.json();

    // Check if the feed sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: {
        id: stickerId,
        competitionId,
      },
    });

    if (!existingSticker) {
      return Response.json({ error: "Feed sticker not found" }, { status: 404 });
    }

    // Validate position if provided
    if (position && !Object.values(StickerPosition).includes(position as StickerPosition)) {
      return Response.json({ error: "Invalid position" }, { status: 400 });
    }

    // Update the feed sticker
    const sticker = await prisma.promotionSticker.update({
      where: {
        id: stickerId,
      },
      data: {
        title: title !== undefined ? title : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        position: position !== undefined ? (position as StickerPosition) : undefined,
        limit: limit !== undefined ? (limit === null ? null : parseInt(limit.toString())) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date(),
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error updating competition feed sticker:", error);
    return Response.json(
      { error: "Failed to update feed sticker" },
      { status: 500 }
    );
  }
}

// DELETE /api/competitions/[competitionId]/feed-stickers/[stickerId]
// Delete a feed sticker for a competition
export async function DELETE(
  req: NextRequest,
  { params }: { params: { competitionId: string; stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, stickerId } = params;

    // Check if the feed sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: {
        id: stickerId,
        competitionId,
      },
    });

    if (!existingSticker) {
      return Response.json({ error: "Feed sticker not found" }, { status: 404 });
    }

    // Delete the feed sticker
    await prisma.promotionSticker.delete({
      where: {
        id: stickerId,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    debug.error("Error deleting competition feed sticker:", error);
    return Response.json(
      { error: "Failed to delete feed sticker" },
      { status: 500 }
    );
  }
}
