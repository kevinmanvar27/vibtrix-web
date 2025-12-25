import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  try {
    // Get site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { showStickeredAdvertisements: true },
    });

    // Return the setting
    return Response.json({
      showStickeredAdvertisements: settings?.showStickeredAdvertisements ?? true,
    });
  } catch (error) {
    debug.error("Error fetching stickered media setting:", error);
    return Response.json(
      {
        error: "Failed to fetch stickered media setting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
