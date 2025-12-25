import { validateRequest } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { secureRawQuery } from "@/lib/sql-security";

import debug from "@/lib/debug";

// This is a server-side API endpoint, so it's safe to create a new PrismaClient here
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    debug.log("API: Clearing login activities");

    // Validate the user is authenticated
    const { user } = await validateRequest();

    if (!user) {
      debug.log("API: User not authenticated");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log("API: User authenticated, ID:", user.id);

    // Check if login activity tracking is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { loginActivityTrackingEnabled: true },
    });

    if (!settings?.loginActivityTrackingEnabled) {
      debug.log("API: Login activity tracking is disabled");
      return Response.json({ error: "Login activity tracking is currently disabled" }, { status: 403 });
    }

    // Use a secure raw SQL query to delete all login activities for this user
    const deleteQuery = `DELETE FROM user_login_activities WHERE "userId" = $1`;
    const secureQuery = secureRawQuery(deleteQuery, [user.id]);
    const result = await prisma.$executeRawUnsafe(secureQuery.query, ...secureQuery.params);

    debug.log("API: SQL query executed, deleted records:", result);

    return Response.json({
      success: true,
      message: "All login activities cleared successfully",
      count: result
    });

  } catch (error) {
    debug.error("API: Error clearing login activities:", error);

    // Log more details about the error
    if (error instanceof Error) {
      debug.error("API: Error message:", error.message);
      debug.error("API: Error stack:", error.stack);
    }

    return Response.json({
      error: "Failed to clear login activities",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
