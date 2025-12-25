import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/stickers/[stickerId]/usages
// Get all usages of a specific sticker
export async function GET(
  req: NextRequest,
  { params }: { params: { stickerId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { stickerId } = params;

    // Get the sticker usages with related media and post information
    const stickerUsages = await prisma.stickerUsage.findMany({
      where: { 
        stickerId,
      },
      include: {
        sticker: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get media information for each sticker usage
    const enhancedStickerUsages = await Promise.all(
      stickerUsages.map(async (usage) => {
        // Find the media that has this URL
        const media = await prisma.media.findFirst({
          where: { url: usage.mediaUrl },
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  }
                }
              }
            }
          }
        });
        
        return {
          ...usage,
          media,
        };
      })
    );

    return Response.json(enhancedStickerUsages);
  } catch (error) {
    debug.error("Error fetching sticker usages:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
