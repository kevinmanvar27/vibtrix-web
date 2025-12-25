import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// PATCH /api/feed-stickers/[stickerId]
// Update a feed sticker
export async function PATCH(
  req: NextRequest,
  { params }: { params: { stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stickerId } = params;
    const { title, imageUrl, position, limit, isActive } = await req.json();

    // Check if the feed sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: { 
        id: stickerId,
        competitionId: "feed", // Ensure it's a feed sticker
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
    const updatedSticker = await prisma.promotionSticker.update({
      where: { id: stickerId },
      data: {
        title: title !== undefined ? title : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        position: position !== undefined ? (position as StickerPosition) : undefined,
        limit: limit !== undefined ? (limit === null ? null : parseInt(limit.toString())) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    return Response.json({ success: true, sticker: updatedSticker });
  } catch (error) {
    debug.error("Error updating feed sticker:", error);
    return Response.json(
      { error: "Failed to update feed sticker" },
      { status: 500 }
    );
  }
}

// DELETE /api/feed-stickers/[stickerId]
// Delete a feed sticker
export async function DELETE(
  req: NextRequest,
  { params }: { params: { stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stickerId } = params;

    // Check if the feed sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: { 
        id: stickerId,
        competitionId: "feed", // Ensure it's a feed sticker
      },
    });

    if (!existingSticker) {
      return Response.json({ error: "Feed sticker not found" }, { status: 404 });
    }

    // Delete the feed sticker
    await prisma.promotionSticker.delete({
      where: { id: stickerId },
    });

    return Response.json({ success: true });
  } catch (error) {
    debug.error("Error deleting feed sticker:", error);
    return Response.json(
      { error: "Failed to delete feed sticker" },
      { status: 500 }
    );
  }
}
