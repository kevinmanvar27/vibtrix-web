/**
 * API route for competition leaderboard
 * GET /api/competitions/{competitionId}/leaderboard
 * 
 * Returns ranked participants with their likes during the competition period
 */
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import debug from "@/lib/debug";

const PAGE_SIZE = 20;

/**
 * GET /api/competitions/{competitionId}/leaderboard
 * Get paginated leaderboard for a competition
 * 
 * Query params:
 * - cursor: Pagination cursor (optional)
 * - roundId: Filter by specific round (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  const { competitionId } = await params;
  try {
    debug.log(`GET /api/competitions/${competitionId}/leaderboard - Starting request`);

    const loggedInUser = await getAuthenticatedUser(request);
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const roundId = request.nextUrl.searchParams.get("roundId") || undefined;

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
        isActive: true,
        completionReason: true,
        rounds: {
          orderBy: { startDate: 'asc' },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            likesToPass: true,
          },
        },
      },
    });

    if (!competition) {
      debug.log(`GET /api/competitions/${competitionId}/leaderboard - Competition not found`);
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Determine which round to use for leaderboard
    const currentDate = new Date();
    let targetRound = competition.rounds[competition.rounds.length - 1]; // Default to last round

    if (roundId) {
      // Use specified round
      const specifiedRound = competition.rounds.find(r => r.id === roundId);
      if (specifiedRound) {
        targetRound = specifiedRound;
      }
    } else {
      // Find the current active round or the most recent completed round
      for (const round of competition.rounds) {
        const roundStart = new Date(round.startDate);
        const roundEnd = new Date(round.endDate);
        
        if (currentDate >= roundStart && currentDate <= roundEnd) {
          targetRound = round;
          break;
        } else if (currentDate > roundEnd) {
          targetRound = round;
        }
      }
    }

    debug.log(`GET /api/competitions/${competitionId}/leaderboard - Using round: ${targetRound.name}`);

    // Get entries for the target round with pagination
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        roundId: targetRound.id,
        participant: {
          isDisqualified: false,
        },
      },
      include: {
        participant: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                onlineStatus: true,
              },
            },
          },
        },
        post: {
          include: {
            attachments: {
              take: 1,
              select: {
                id: true,
                url: true,
                urlThumbnail: true,
                type: true,
              },
            },
            likes: {
              select: {
                createdAt: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
      take: PAGE_SIZE + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    // Calculate likes during competition period for each entry
    const roundStartDate = new Date(targetRound.startDate);
    const roundEndDate = new Date(targetRound.endDate);

    const entriesWithLikes = entries.map(entry => {
      if (!entry.post) {
        return {
          entry,
          competitionLikes: 0,
          totalLikes: 0,
        };
      }

      // Count likes during competition period
      const competitionLikes = entry.post.likes.filter(like => {
        const likeDate = new Date(like.createdAt);
        return likeDate >= roundStartDate && likeDate <= roundEndDate;
      }).length;

      return {
        entry,
        competitionLikes,
        totalLikes: entry.post._count.likes,
      };
    });

    // Sort by competition likes (descending)
    const sortedEntries = entriesWithLikes.sort((a, b) => 
      b.competitionLikes - a.competitionLikes
    );

    // Check if there are more results
    const hasMore = sortedEntries.length > PAGE_SIZE;
    const paginatedEntries = sortedEntries.slice(0, PAGE_SIZE);

    // Build leaderboard response
    const leaderboard = paginatedEntries.map((item, index) => {
      const { entry, competitionLikes, totalLikes } = item;
      const user = entry.participant.user;
      const post = entry.post;

      // Calculate rank (considering pagination)
      // Note: For accurate ranking across pages, you'd need a different approach
      // This gives relative position within the current page
      const rank = cursor ? undefined : index + 1;

      return {
        rank,
        participantId: entry.participant.id,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          onlineStatus: user.onlineStatus,
          isFollowedByMe: false, // TODO: Add if loggedInUser exists
        },
        post: post ? {
          id: post.id,
          thumbnail: post.attachments[0]?.urlThumbnail || post.attachments[0]?.url || null,
          mediaType: post.attachments[0]?.type || null,
          totalComments: post._count.comments,
        } : null,
        likes: {
          competition: competitionLikes,
          total: totalLikes,
        },
        likesToPass: targetRound.likesToPass,
        hasQualified: targetRound.likesToPass ? competitionLikes >= targetRound.likesToPass : null,
      };
    });

    // Add follow status if user is logged in
    if (loggedInUser) {
      const userIds = leaderboard.map(item => item.user.id);
      
      const followStatuses = await prisma.follow.findMany({
        where: {
          followerId: loggedInUser.id,
          followingId: { in: userIds },
        },
        select: {
          followingId: true,
        },
      });

      const followingSet = new Set(followStatuses.map(f => f.followingId));

      leaderboard.forEach(item => {
        item.user.isFollowedByMe = followingSet.has(item.user.id);
      });
    }

    // Get next cursor
    const nextCursor = hasMore ? paginatedEntries[paginatedEntries.length - 1]?.entry.id : null;

    debug.log(`GET /api/competitions/${competitionId}/leaderboard - Returning ${leaderboard.length} entries`);

    return Response.json({
      competition: {
        id: competition.id,
        title: competition.title,
        isActive: competition.isActive,
        completionReason: competition.completionReason,
      },
      round: {
        id: targetRound.id,
        name: targetRound.name,
        startDate: targetRound.startDate,
        endDate: targetRound.endDate,
        likesToPass: targetRound.likesToPass,
      },
      leaderboard,
      nextCursor,
      totalParticipants: await prisma.competitionRoundEntry.count({
        where: {
          roundId: targetRound.id,
          participant: { isDisqualified: false },
        },
      }),
    });

  } catch (error) {
    debug.error(`Error fetching leaderboard for competition ${competitionId}:`, error);
    return Response.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
