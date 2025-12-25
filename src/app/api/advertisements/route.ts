import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/advertisements - Get active advertisements
export async function GET(req: NextRequest) {
  try {
    // Get user but don't require authentication
    const { user } = await validateRequest();

    // Log whether user is authenticated (for debugging)
    debug.log("Advertisement request - user authenticated:", !!user);

    // Check if advertisements feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { advertisementsEnabled: true },
    });

    debug.log("Advertisement settings:", settings);

    // Default to enabled if settings don't exist
    const advertisementsEnabled = settings?.advertisementsEnabled !== false;

    if (!advertisementsEnabled) {
      debug.log("Advertisements feature is disabled");
      return Response.json({ advertisements: [] });
    }

    // Get current date
    const now = new Date();
    debug.log("Current date for ad filtering:", now);

    // Check if a competition ID is provided in the query params
    const url = new URL(req.url);
    const competitionId = url.searchParams.get("competitionId");

    // Base query conditions
    const baseConditions = {
      status: AdvertisementStatus.ACTIVE,
      scheduleDate: {
        lte: now,
      },
      expiryDate: {
        gte: now,
      },
    };

    // Add competition filter if provided
    const whereConditions = competitionId
      ? { ...baseConditions, competitionId }
      : { ...baseConditions, competitionId: null }; // Only global ads if no competition specified

    // Get active advertisements
    const advertisements = await prisma.advertisement.findMany({
      where: whereConditions,
      include: {
        media: true,
        competition: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    debug.log(`Found ${advertisements.length} active advertisements${competitionId ? ` for competition ${competitionId}` : ''}`);

    // Log more details about the advertisements for debugging
    if (advertisements.length > 0) {
      debug.log("Active advertisements:", advertisements.map(ad => ({
        id: ad.id,
        title: ad.title,
        mediaId: ad.mediaId,
        mediaUrl: ad.media?.url,
        adType: ad.adType,
        skipDuration: ad.skipDuration,
        displayFrequency: ad.displayFrequency,
        url: ad.url,
        competitionId: ad.competitionId,
        competitionTitle: ad.competition?.title
      })));
    }

    // If no active ads, check if there are any ads at all (for debugging)
    if (advertisements.length === 0) {
      const allAdsQuery = competitionId
        ? { competitionId }
        : { competitionId: null };

      const allAds = await prisma.advertisement.findMany({
        where: allAdsQuery,
        select: {
          id: true,
          title: true,
          status: true,
          scheduleDate: true,
          expiryDate: true,
          competitionId: true
        },
      });

      debug.log(`Total advertisements in database${competitionId ? ` for competition ${competitionId}` : ''}: ${allAds.length}`);
      if (allAds.length > 0) {
        debug.log("Advertisement statuses:", allAds.map(ad => ({
          id: ad.id,
          title: ad.title,
          status: ad.status,
          scheduleDate: ad.scheduleDate,
          expiryDate: ad.expiryDate,
          competitionId: ad.competitionId,
          isScheduledValid: ad.scheduleDate <= now,
          isExpiryValid: ad.expiryDate >= now
        })));
      }
    }

    return Response.json({ advertisements });
  } catch (error) {
    debug.error("Error fetching advertisements:", error);
    return Response.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
