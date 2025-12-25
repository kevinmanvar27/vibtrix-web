import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

/**
 * Cron job endpoint to update competition visibility
 * This ensures that posts for rounds that have started are visible in the competition feed
 * This endpoint should be called periodically (e.g., every hour) to keep visibility settings up to date
 */
export async function GET(req: NextRequest) {
  try {
    debug.log(`GET /api/cron/update-competition-visibility - Starting request`);
    
    // Check for API key in header for cron job authentication
    const apiKey = req.headers.get("x-api-key");
    
    // Validate API key
    if (apiKey !== process.env.CRON_API_KEY) {
      debug.log(`GET /api/cron/update-competition-visibility - Invalid API key`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentDate = new Date();
    
    // Find all active competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });
    
    debug.log(`GET /api/cron/update-competition-visibility - Found ${activeCompetitions.length} active competitions`);
    
    let updatedEntries = 0;
    const results = [];
    
    for (const comp of activeCompetitions) {
      debug.log(`GET /api/cron/update-competition-visibility - Processing competition: ${comp.title} (ID: ${comp.id});`);
      
      // Process each round
      for (const round of comp.rounds) {
        const hasStarted = new Date(round.startDate) <= currentDate;
        
        debug.log(`GET /api/cron/update-competition-visibility - Round: ${round.name} (ID: ${round.id});, Has started: ${hasStarted}`);
        
        // Get entries for this round
        const entries = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: round.id,
            postId: { not: null } // Only entries with posts
          },
          include: {
            participant: {
              select: {
                user: {
                  select: {
                    username: true
                  }
                }
              }
            }
          }
        });
        
        debug.log(`GET /api/cron/update-competition-visibility - Found ${entries.length} entries with posts for this round`);
        
        // Update visibility for each entry
        for (const entry of entries) {
          // If the round has started, posts should be visible
          const shouldBeVisible = hasStarted;
          
          if (entry.visibleInCompetitionFeed !== shouldBeVisible || entry.visibleInNormalFeed !== shouldBeVisible) {
            debug.log(`GET /api/cron/update-competition-visibility - Updating entry ${entry.id} for user ${entry.participant.user.username}`);
            
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: shouldBeVisible,
                visibleInNormalFeed: shouldBeVisible
              }
            });
            
            updatedEntries++;
            results.push({
              entryId: entry.id,
              username: entry.participant.user.username,
              roundId: round.id,
              roundName: round.name,
              previousVisibility: {
                competitionFeed: entry.visibleInCompetitionFeed,
                normalFeed: entry.visibleInNormalFeed
              },
              newVisibility: {
                competitionFeed: shouldBeVisible,
                normalFeed: shouldBeVisible
              }
            });
          }
        }
      }
    }
    
    debug.log(`GET /api/cron/update-competition-visibility - Updated ${updatedEntries} entries`);
    
    return Response.json({
      success: true,
      message: `Updated competition visibility for ${activeCompetitions.length} competitions`,
      updatedEntries,
      results
    });
  } catch (error) {
    debug.error('Error updating competition visibility:', error);
    return Response.json({
      error: "Failed to update competition visibility",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
