import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

export async function GET(
  request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;

    // Verify the competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Get all active promotion stickers for this competition
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId: competitionId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        position: true,
        limit: true,
        _count: {
          select: {
            usages: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    // Filter out stickers that have reached their limit
    const availableStickers = stickers.filter(sticker => {
      if (!sticker.limit) return true; // No limit
      return sticker._count.usages < sticker.limit;
    });

    return Response.json({ stickers: availableStickers });
  } catch (error) {
    debug.error("Error fetching competition stickers:", error);
    return Response.json(
      { error: "Failed to fetch stickers" },
      { status: 500 }
    );
  }
}
