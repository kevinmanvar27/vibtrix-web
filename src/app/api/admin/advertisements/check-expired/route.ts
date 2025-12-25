import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// GET /api/admin/advertisements/check-status - Check and update advertisement statuses
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");

    // Verify the request is authorized with the CRON_SECRET
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json(
        { error: "Invalid authorization header" },
        { status: 401 }
      );
    }

    // Get current date
    const now = new Date();
    const results = { expired: 0, activated: 0 };

    // 1. Find advertisements that have expired but not marked as expired
    const expiredAds = await prisma.advertisement.findMany({
      where: {
        expiryDate: {
          lt: now,
        },
        status: {
          not: AdvertisementStatus.EXPIRED,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (expiredAds.length > 0) {
      // Update all expired advertisements to have status EXPIRED
      await prisma.advertisement.updateMany({
        where: {
          id: {
            in: expiredAds.map((ad) => ad.id),
          },
        },
        data: {
          status: AdvertisementStatus.EXPIRED,
          updatedAt: now,
        },
      });

      results.expired = expiredAds.length;
    }

    // 2. Find SCHEDULED advertisements that should now be ACTIVE
    const scheduledAds = await prisma.advertisement.findMany({
      where: {
        scheduleDate: {
          lte: now,
        },
        expiryDate: {
          gt: now,
        },
        status: AdvertisementStatus.SCHEDULED,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (scheduledAds.length > 0) {
      // Update all scheduled advertisements that should now be active
      await prisma.advertisement.updateMany({
        where: {
          id: {
            in: scheduledAds.map((ad) => ad.id),
          },
        },
        data: {
          status: AdvertisementStatus.ACTIVE,
          updatedAt: now,
        },
      });

      results.activated = scheduledAds.length;
    }

    return Response.json({
      message: `Updated advertisement statuses: ${results.expired} expired, ${results.activated} activated`,
      results,
      expiredAds: expiredAds.length > 0 ? expiredAds : undefined,
      activatedAds: scheduledAds.length > 0 ? scheduledAds : undefined,
    });
  } catch (error) {
    debug.error("Error updating advertisement statuses:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
