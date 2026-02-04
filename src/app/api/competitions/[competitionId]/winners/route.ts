import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    debug.log(`🏆 Fetching winners for competition: ${competitionId}`);

    // Get competition details to check if it's completed
    debug.log('📋 Fetching competition details...');
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
        completionReason: true,
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
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
      debug.error(`❌ Competition not found: ${competitionId}`);
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    debug.log(`✅ Competition found: ${competition.title}`);
    debug.log(`📅 Rounds: ${competition.rounds.length}`);

    // Check if the competition is completed
    const currentDate = new Date();
    const allRoundsEnded = competition.rounds.every(round =>
      new Date(round.endDate) < currentDate
    );

    if (!allRoundsEnded) {
      debug.log('⏳ Competition not completed yet');
      return Response.json({ 
        error: "Competition not completed yet",
        isCompleted: false 
      }, { status: 400 });
    }

    debug.log('✅ Competition is completed, fetching participants...');

    // Get all participants who weren't disqualified
    const participants = await prisma.competitionParticipant.findMany({
      where: {
        competitionId: competition.id,
        isDisqualified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    debug.log(`👥 Found ${participants.length} participants`);

    // If there are no participants at all, return early
    if (participants.length === 0) {
      debug.log('❌ No participants found for this competition');
      return Response.json({
        isCompleted: true,
        noParticipants: true,
        completionReason: "No participants joined the competition",
        winners: []
      });
    }

    // Get all rounds of the competition in order
    const rounds = competition.rounds;
    const lastRound = rounds[rounds.length - 1];

    debug.log(`🎯 Last round: ${lastRound.name} (ID: ${lastRound.id})`);

    // Simple approach: just get the top 3 participants from the last round
    // based on their post likes during the competition period
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        roundId: lastRound.id,
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
              },
            },
          },
        },
        post: {
          include: {
            attachments: true,
            likes: true,
            _count: {
              select: {
                likes: true,
              },
            },
          },
        },
        round: true,
      },
    });

    debug.log(`📝 Found ${entries.length} entries in final round`);

    if (entries.length === 0) {
      debug.log('❌ No entries found in final round');
      return Response.json({
        isCompleted: true,
        noParticipants: true,
        completionReason: "No entries found in the final round",
        winners: []
      });
    }

    // Calculate likes for each entry during competition period
    const entriesWithLikes = entries.map(entry => {
      if (!entry.post) {
        return { entry, competitionLikesCount: 0, totalLikes: 0 };
      }

      const roundStartDate = new Date(entry.round.startDate);
      const roundEndDate = new Date(entry.round.endDate);

      // Count likes during competition period
      const competitionLikes = entry.post.likes.filter(like => {
        const likeDate = new Date(like.createdAt);
        return likeDate >= roundStartDate && likeDate <= roundEndDate;
      });

      return {
        entry,
        competitionLikesCount: competitionLikes.length,
        totalLikes: entry.post._count.likes
      };
    });

    // Sort by competition-period likes (descending)
    const sortedEntries = entriesWithLikes.sort((a, b) => 
      b.competitionLikesCount - a.competitionLikesCount
    );

    debug.log('🏆 Top entries:', sortedEntries.slice(0, 3).map(e => ({
      username: e.entry.participant.user.username,
      likes: e.competitionLikesCount
    })));

    // Get top 3 entries for winners
    const topEntries = sortedEntries.slice(0, 3);

    // Create winners array
    const winners = topEntries.map((item, index) => ({
      position: index + 1,
      userId: item.entry.participant.user.id,
      username: item.entry.participant.user.username,
      displayName: item.entry.participant.user.displayName,
      avatarUrl: item.entry.participant.user.avatarUrl,
      postId: item.entry.post?.id || null,
      likes: item.competitionLikesCount,
      totalLikes: item.totalLikes,
      mediaUrl: item.entry.post?.attachments[0]?.url || null,
      mediaType: item.entry.post?.attachments[0]?.type || null,
    }));

    debug.log(`🎉 Returning ${winners.length} winners`);

    return Response.json({
      isCompleted: true,
      winners,
    });

  } catch (error) {
    debug.error("❌ Error in winners API:", error);
    
    // Return a more specific error message
    return Response.json({ 
      error: "Failed to load winners", 
      details: error instanceof Error ? error.message : "Unknown error",
      isCompleted: true,
      winners: []
    }, { status: 500 });
  }
}
