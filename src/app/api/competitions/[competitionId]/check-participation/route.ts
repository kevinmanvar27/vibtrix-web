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
      return Response.json({ isParticipant: false }, { status: 200 });
    }

    const { competitionId } = params;

    // Get competition details to check if it's paid
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { isPaid: true }
    });

    // Check if the user is already a participant
    const existingParticipant = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId,
        },
      },
    });

    // For paid competitions, only consider them a participant if they've paid
    const isValidParticipant = competition?.isPaid
      ? existingParticipant && existingParticipant.hasPaid
      : !!existingParticipant;

    return Response.json({
      isParticipant: isValidParticipant
    });
  } catch (error) {
    debug.error("Error checking participation:", error);
    return Response.json({ isParticipant: false }, { status: 200 });
  }
}
