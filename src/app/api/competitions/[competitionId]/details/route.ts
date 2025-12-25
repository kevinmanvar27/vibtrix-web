"use server";

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

    const competitionId = params.competitionId;

    if (!competitionId) {
      return Response.json({ error: "Competition ID is required" }, { status: 400 });
    }

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    return Response.json({ competition });
  } catch (error) {
    debug.error("Error fetching competition details:", error);
    return Response.json({
      error: error instanceof Error ? error.message : "Failed to fetch competition details"
    }, { status: 500 });
  }
}
