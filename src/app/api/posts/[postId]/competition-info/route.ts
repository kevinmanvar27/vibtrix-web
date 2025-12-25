import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;

    // Find competition entry for this post
    const entry = await prisma.competitionRoundEntry.findFirst({
      where: {
        postId,
      },
      include: {
        round: {
          include: {
            competition: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!entry || !entry.round || !entry.round.competition) {
      return Response.json({ 
        competition: null 
      });
    }

    return Response.json({
      competition: {
        id: entry.round.competition.id,
        title: entry.round.competition.title,
        slug: entry.round.competition.slug,
      },
    });
  } catch (error) {
    debug.error("Error getting post competition info:", error);
    return Response.json(
      { error: "Failed to get post competition info", details: String(error) },
      { status: 500 }
    );
  }
}
