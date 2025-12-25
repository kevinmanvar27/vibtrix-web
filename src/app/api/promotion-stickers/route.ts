import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/promotion-stickers
// Get all promotion stickers
export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all promotion stickers
    const stickers = await prisma.promotionSticker.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(stickers);
  } catch (error) {
    debug.error("Error getting promotion stickers:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
