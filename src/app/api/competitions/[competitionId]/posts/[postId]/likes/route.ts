import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string; postId: string } }
) {
  try {
    const { competitionId, postId } = params;

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Find the competition round entry for this post
    const entry = await prisma.competitionRoundEntry.findFirst({
      where: {
        postId,
        round: {
          competitionId,
        },
      },
      include: {
        round: true,
      },
    });

    if (!entry) {
      return Response.json({ error: "Competition entry not found" }, { status: 404 });
    }

    // Get post details with all likes
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        likes: true,
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Get the round start and end dates
    const roundStartDate = new Date(entry.round.startDate);
    const roundEndDate = new Date(entry.round.endDate);

    // Filter likes that were created within the competition timeframe
    const competitionLikesArray = post.likes.filter(like => {
      const likeDate = new Date(like.createdAt);
      return likeDate >= roundStartDate && likeDate <= roundEndDate;
    });

    // Count of likes within competition timeframe
    const competitionLikes = competitionLikesArray.length;

    // Total likes (including those outside the competition timeframe)
    const totalLikes = post._count.likes;

    debug.log(`Post ${postId}: Competition likes: ${competitionLikes}, Total likes: ${totalLikes}`);

    return Response.json({
      competitionLikes,
      totalLikes,
    });
  } catch (error) {
    debug.error("Error getting competition post likes:", error);
    return Response.json(
      { error: "Failed to get competition post likes", details: String(error) },
      { status: 500 }
    );
  }
}
