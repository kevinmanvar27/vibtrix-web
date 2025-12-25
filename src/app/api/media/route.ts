import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// POST /api/media - Create a new media record
export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    // Check if user has admin access
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, type } = await req.json();

    if (!url || !type) {
      return Response.json(
        { error: "URL and type are required" },
        { status: 400 }
      );
    }

    // Create a new media record
    const media = await prisma.media.create({
      data: {
        url,
        type: type as MediaType,
      },
    });

    return Response.json(media);
  } catch (error) {
    debug.error("Error creating media:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
