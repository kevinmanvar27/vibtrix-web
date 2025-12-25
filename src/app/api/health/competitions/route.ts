import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  try {
    // Get the competition ID or slug from the query parameters
    const searchParams = req.nextUrl.searchParams;
    const competitionId = searchParams.get("id");
    const competitionSlug = searchParams.get("slug");

    if (!competitionId && !competitionSlug) {
      // If no ID or slug is provided, check if any competitions exist
      const competitionsCount = await prisma.competition.count();
      
      if (competitionsCount === 0) {
        return Response.json({
          status: "warning",
          message: "No competitions found in the database",
          count: 0
        }, { status: 200 });
      }
      
      // Get a sample of competitions to verify they're accessible
      const competitions = await prisma.competition.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          isActive: true,
          _count: {
            select: {
              participants: true,
              rounds: true
            }
          }
        },
        take: 5
      });
      
      return Response.json({
        status: "ok",
        message: "Competitions system is healthy",
        count: competitionsCount,
        sample: competitions
      }, { status: 200 });
    }

    // If an ID is provided, check that specific competition
    if (competitionId) {
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        select: {
          id: true,
          title: true,
          slug: true,
          isActive: true,
          _count: {
            select: {
              participants: true,
              rounds: true
            }
          }
        }
      });
      
      if (!competition) {
        return Response.json({
          status: "error",
          message: `Competition with ID ${competitionId} not found`
        }, { status: 404 });
      }
      
      return Response.json({
        status: "ok",
        message: `Competition with ID ${competitionId} is accessible`,
        competition
      }, { status: 200 });
    }

    // If a slug is provided, check that specific competition
    if (competitionSlug) {
      const competition = await prisma.competition.findUnique({
        where: { slug: competitionSlug },
        select: {
          id: true,
          title: true,
          slug: true,
          isActive: true,
          _count: {
            select: {
              participants: true,
              rounds: true
            }
          }
        }
      });
      
      if (!competition) {
        return Response.json({
          status: "error",
          message: `Competition with slug ${competitionSlug} not found`
        }, { status: 404 });
      }
      
      return Response.json({
        status: "ok",
        message: `Competition with slug ${competitionSlug} is accessible`,
        competition
      }, { status: 200 });
    }

    // This should never happen due to the checks above
    return Response.json({
      status: "error",
      message: "Invalid request"
    }, { status: 400 });
  } catch (error) {
    debug.error("Error in competition health check:", error);
    return Response.json({
      status: "error",
      message: "Failed to check competition health",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
