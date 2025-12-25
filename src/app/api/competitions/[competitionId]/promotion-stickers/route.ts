import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/competitions/[competitionId]/promotion-stickers
// Get all promotion stickers for a competition
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
    const includeUsage = req.nextUrl.searchParams.get('includeUsage') === 'true';

    // Check if competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get all promotion stickers for the competition
    const promotionStickers = await prisma.promotionSticker.findMany({
      where: { competitionId },
      orderBy: { createdAt: "desc" },
      ...(includeUsage ? {
        include: {
          _count: {
            select: {
              usages: true,
            },
          },
          usages: {
            select: {
              isDeleted: true,
            },
          },
        },
      } : {}),
    });

    return Response.json(promotionStickers);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/competitions/[competitionId]/promotion-stickers
// Create a new promotion sticker for a competition
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

    // Create the promotion sticker
    const promotionSticker = await prisma.promotionSticker.create({
      data: {
        title,
        imageUrl,
        position: position as StickerPosition,
        limit: limit ? parseInt(limit.toString()) : null,
        isActive: isActive !== undefined ? isActive : true,
        competitionId,
      },
    });

    return Response.json(promotionSticker);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
