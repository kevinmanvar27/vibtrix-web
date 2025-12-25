import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/promotion-stickers/[stickerId]
// Get a specific promotion sticker
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

    // Get the promotion sticker
    const promotionSticker = await prisma.promotionSticker.findUnique({
      where: { 
        id: stickerId,
        competitionId,
      },
    });

    if (!promotionSticker) {
      return Response.json({ error: "Promotion sticker not found" }, { status: 404 });
    }

    return Response.json(promotionSticker);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/competitions/[competitionId]/promotion-stickers/[stickerId]
// Update a promotion sticker
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

    // Check if the promotion sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: { 
        id: stickerId,
        competitionId,
      },
    });

    if (!existingSticker) {
      return Response.json({ error: "Promotion sticker not found" }, { status: 404 });
    }

    // Validate position if provided
    if (position && !Object.values(StickerPosition).includes(position as StickerPosition)) {
      return Response.json({ error: "Invalid position" }, { status: 400 });
    }

    // Update the promotion sticker
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

    return Response.json(updatedSticker);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/competitions/[competitionId]/promotion-stickers/[stickerId]
// Delete a promotion sticker
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

    // Check if the promotion sticker exists
    const existingSticker = await prisma.promotionSticker.findUnique({
      where: { 
        id: stickerId,
        competitionId,
      },
    });

    if (!existingSticker) {
      return Response.json({ error: "Promotion sticker not found" }, { status: 404 });
    }

    // Delete the promotion sticker
    await prisma.promotionSticker.delete({
      where: { id: stickerId },
    });

    return Response.json({ success: true });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
