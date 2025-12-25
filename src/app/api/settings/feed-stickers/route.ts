import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

// Cache the setting value for 10 seconds to reduce database queries
let cachedSetting: { value: boolean, timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds in milliseconds

export async function GET(req: NextRequest) {
  try {
    // Check if we have a valid cached value
    const now = Date.now();
    if (cachedSetting && (now - cachedSetting.timestamp < CACHE_TTL)) {
      // Use cached value if it's still valid
      return Response.json({
        showFeedStickers: cachedSetting.value,
        fromCache: true,
        cacheAge: Math.round((now - cachedSetting.timestamp) / 1000) + 's'
      }, {
        headers: {
          'Cache-Control': 'private, max-age=10',
        },
        status: 200
      });
    }

    // No valid cache, query the database
    // First, make sure the column exists (only do this once per server start)
    if (!cachedSetting) {
      await prisma.$executeRaw`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showFeedStickers" BOOLEAN NOT NULL DEFAULT true;`;
    }

    // Get site settings directly with a simple query
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
    });

    // Determine the value to return
    let showFeedStickers = true; // Default to true

    if (settings) {
      // If the setting exists in the database, use that value
      showFeedStickers = settings.showFeedStickers === true;
    } else {
      // If no settings record exists, create one with default values
      await prisma.siteSettings.create({
        data: {
          id: "settings",
          showFeedStickers: true,
        },
      });
    }

    // Update the cache
    cachedSetting = {
      value: showFeedStickers,
      timestamp: now
    };

    // Return the setting
    return Response.json({
      showFeedStickers: showFeedStickers,
      fromCache: false
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10',
      },
      status: 200
    });
  } catch (error) {
    debug.error("Error fetching feed stickers setting:", error);

    // If there's an error, return the default value
    return Response.json({
      showFeedStickers: true,
      error: "Error fetching setting, using default value"
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}
