import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/default-sticker
// Get the default feed sticker for a competition
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

    // Get the default feed sticker
    const sticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId,
        id: `default-${competitionId}`,
      },
    });

    if (!sticker) {
      return Response.json({ sticker: null }, { status: 404 });
    }

    return Response.json({ sticker });
  } catch (error) {
    debug.error("Error getting default competition feed sticker:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/competitions/[competitionId]/default-sticker
// Create the default feed sticker for a competition
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

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Check if a default sticker already exists
    const existingSticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId,
        id: `default-${competitionId}`,
      },
    });

    if (existingSticker) {
      return Response.json(
        { error: "Default sticker already exists. Use PATCH to update it." },
        { status: 400 }
      );
    }

    // Create the default feed sticker
    const sticker = await prisma.promotionSticker.create({
      data: {
        id: `default-${competitionId}`,
        title,
        imageUrl,
        position: position as StickerPosition,
        limit: null, // Explicitly set limit to null for unlimited usage
        isActive: isActive !== undefined ? isActive : true,
        competitionId,
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error creating default competition feed sticker:", error);
    return Response.json(
      { error: "Failed to create default feed sticker" },
      { status: 500 }
    );
  }
}

// PATCH /api/competitions/[competitionId]/default-sticker
// Update the default feed sticker for a competition
export async function PATCH(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;
    const { title, imageUrl, position, isActive } = await req.json();

    // Check if the default feed sticker exists
    const existingSticker = await prisma.promotionSticker.findFirst({
      where: {
        competitionId,
        id: `default-${competitionId}`,
      },
    });

    if (!existingSticker) {
      return Response.json(
        { error: "Default sticker not found. Use POST to create it." },
        { status: 404 }
      );
    }

    // Validate position if provided
    if (position && !Object.values(StickerPosition).includes(position as StickerPosition)) {
      return Response.json({ error: "Invalid position" }, { status: 400 });
    }

    // Update the default feed sticker
    const sticker = await prisma.promotionSticker.update({
      where: {
        id: `default-${competitionId}`,
      },
      data: {
        title: title !== undefined ? title : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        position: position !== undefined ? (position as StickerPosition) : undefined,
        limit: null, // Always ensure limit is null (unlimited) for default stickers
        isActive: isActive !== undefined ? isActive : undefined,
        updatedAt: new Date(),
      },
    });

    return Response.json({ success: true, sticker });
  } catch (error) {
    debug.error("Error updating default competition feed sticker:", error);
    return Response.json(
      { error: "Failed to update default feed sticker" },
      { status: 500 }
    );
  }
}
