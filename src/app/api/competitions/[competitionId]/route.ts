import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
        DefaultStickers: {
          include: {
            competition_stickers: true,
          },
        },
        OptionalStickers: {
          include: {
            competition_stickers: true,
          },
        },
        participants: {
          where: {
            userId: user.id,
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
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Check if the user is a participant
    const isParticipant = competition.participants.length > 0;

    // Filter out duplicate rounds by name
    const uniqueRoundsByName = new Map();

    // Process each round
    competition.rounds.forEach(round => {
      // If we haven't seen this round name yet, or this round is newer than the one we've seen
      if (!uniqueRoundsByName.has(round.name) ||
          new Date(round.createdAt) > new Date(uniqueRoundsByName.get(round.name).createdAt)) {
        uniqueRoundsByName.set(round.name, round);
      }
    });

    // Format the response with filtered rounds
    const response = {
      ...competition,
      rounds: Array.from(uniqueRoundsByName.values()),
      isParticipant,
    };

    return Response.json(response);
  } catch (error) {
    debug.error("Error fetching competition details:", error);
    return Response.json(
      { error: "Failed to fetch competition details" },
      { status: 500 }
    );
  }
}
