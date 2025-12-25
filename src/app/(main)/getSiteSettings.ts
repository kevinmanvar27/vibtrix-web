"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

import debug from "@/lib/debug";

// Use React's cache to avoid multiple database calls for the same data
export const getSiteSettings = cache(async () => {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        logoUrl: true,
        logoHeight: true,
        logoWidth: true,
        faviconUrl: true,
        googleAnalyticsEnabled: true,
        googleAnalyticsId: true,
      },
    });

    return settings || {
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
      googleAnalyticsEnabled: false,
      googleAnalyticsId: null,
    };
  } catch (error) {
    debug.error("Error fetching site settings:", error);
    // Default to no logo if there's an error
    return {
      logoUrl: null,
      logoHeight: 30,
      logoWidth: 150,
      faviconUrl: null,
      googleAnalyticsEnabled: false,
      googleAnalyticsId: null,
    };
  }
});
