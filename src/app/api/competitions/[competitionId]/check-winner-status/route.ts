import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { competitionId } = params;
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return Response.json({ error: "Username is required" }, { status: 400 });
    }

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

    // Get the user
    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get the participant
    const participant = await prisma.competitionParticipant.findFirst({
      where: {
        competitionId,
        userId: user.id,
      },
      include: {
        roundEntries: {
          include: {
            round: true,
            post: {
              include: {
                _count: {
                  select: {
                    likes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return Response.json({ error: "User is not a participant in this competition" }, { status: 404 });
    }

    // Get the last round
    const lastRound = competition.rounds[competition.rounds.length - 1];

    // Check if the participant has an entry in the last round
    const finalRoundEntry = participant.roundEntries.find(e => e.roundId === lastRound.id);

    // Check qualification status for each round
    const roundStatus = competition.rounds.map(round => {
      const entry = participant.roundEntries.find(e => e.roundId === round.id);
      const likesReceived = entry?.post?._count?.likes || 0;
      const likesRequired = round.likesToPass || 0;
      const qualified = likesReceived >= likesRequired;

      return {
        roundId: round.id,
        roundName: round.name,
        hasEntry: !!entry,
        hasPost: !!(entry && entry.post),
        likesReceived,
        likesRequired,
        qualified,
        qualifiedForNextRound: entry?.qualifiedForNextRound,
        visibleInCompetitionFeed: entry?.visibleInCompetitionFeed,
        visibleInNormalFeed: entry?.visibleInNormalFeed,
        winnerPosition: entry?.winnerPosition,
      };
    });

    // Check if the participant is a winner
    const isWinner = finalRoundEntry?.winnerPosition !== null && finalRoundEntry?.winnerPosition !== undefined;
    const winnerPosition = finalRoundEntry?.winnerPosition;

    // Check if the participant is qualified for the final round
    let qualifiedForFinalRound = true;
    for (let i = 0; i < competition.rounds.length - 1; i++) {
      const round = competition.rounds[i];
      const entry = participant.roundEntries.find(e => e.roundId === round.id);
      
      if (!entry || !entry.post) {
        qualifiedForFinalRound = false;
        break;
      }
      
      const likesReceived = entry.post._count.likes;
      const likesRequired = round.likesToPass || 0;
      
      if (likesReceived < likesRequired) {
        qualifiedForFinalRound = false;
        break;
      }
    }

    return Response.json({
      username,
      competitionId,
      competitionTitle: competition.title,
      isParticipant: true,
      roundStatus,
      qualifiedForFinalRound,
      hasFinalRoundEntry: !!finalRoundEntry,
      hasFinalRoundPost: !!(finalRoundEntry && finalRoundEntry.post),
      isWinner,
      winnerPosition,
    });
  } catch (error) {
    debug.error("Error checking winner status:", error);
    return Response.json(
      { error: "Failed to check winner status", details: String(error) },
      { status: 500 }
    );
  }
}
