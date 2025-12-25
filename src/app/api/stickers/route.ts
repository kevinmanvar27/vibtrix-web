import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { StickerPosition } from "@prisma/client";

import debug from "@/lib/debug";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stickers = await prisma.competitionSticker.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(stickers);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, imageUrl, position, isDefault } = await req.json();

    if (!name || !imageUrl || !position) {
      return Response.json(
        { error: "Name, imageUrl, and position are required" },
        { status: 400 }
      );
    }

    // Validate position
    if (!Object.values(StickerPosition).includes(position as StickerPosition)) {
      return Response.json(
        { error: "Invalid position" },
        { status: 400 }
      );
    }

    const sticker = await prisma.competitionSticker.create({
      data: {
        name,
        imageUrl,
        position: position as StickerPosition,
        isDefault: isDefault || false,
      },
    });

    return Response.json(sticker);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
