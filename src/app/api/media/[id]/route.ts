import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/media/[id] - Get a specific media
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();

    // Check if user is authenticated
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get the media
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return Response.json({ error: "Media not found" }, { status: 404 });
    }

    return Response.json(media);
  } catch (error) {
    debug.error("Error fetching media:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
