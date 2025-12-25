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

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    const { competitionId } = params;

    // Get competition details with admin-specific data
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            roundEntries: true,
          },
        },
        prizes: true,
        _count: {
          select: {
            participants: true,
            rounds: true,
            prizes: true,
          },
        },
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    return Response.json(competition);
  } catch (error) {
    debug.error("Error fetching competition details for admin:", error);
    return Response.json(
      { error: "Failed to fetch competition details" },
      { status: 500 }
    );
  }
}
