import { validateRequest } from "@/auth";
import { Shield } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import LoginActivityClient from "./LoginActivityClient";
import prisma from "@/lib/prisma";
import { getFeatureSettings } from "@/lib/get-feature-settings";
import { secureRawQuery } from "@/lib/sql-security";

import debug from "@/lib/debug";

export const metadata = {
  title: "Login Activity",
};

export default async function LoginActivityPage() {
  const { user } = await validateRequest();

  if (!user) {
    return notFound();
  }

  // Check if login activity tracking is enabled
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "settings" },
    select: { loginActivityTrackingEnabled: true },
  });

  // Redirect to settings page if login activity tracking is disabled
  if (!settings?.loginActivityTrackingEnabled) {
    return redirect('/settings');
  }

  // Get the user's login activity using a raw SQL query to avoid Prisma client issues
  let loginActivities = [];
  try {
    debug.log("Fetching login activities for user ID:", user.id);

    // Use a secure raw SQL query to get login activities
    const selectQuery = `
      SELECT
        id,
        "userId",
        "ipAddress",
        "userAgent",
        browser,
        "operatingSystem",
        "deviceType",
        "deviceBrand",
        "deviceModel",
        location,
        city,
        region,
        country,
        "loginAt",
        status
      FROM user_login_activities
      WHERE "userId" = $1
      ORDER BY "loginAt" DESC
      LIMIT 20
    `;
    const secureQuery = secureRawQuery(selectQuery, [user.id]);
    const activities = await prisma.$queryRawUnsafe(secureQuery.query, ...secureQuery.params);

    // Convert the result to an array
    loginActivities = Array.isArray(activities) ? activities : [];

    debug.log("Login activities fetched:", loginActivities.length);

    // Log the first activity for debugging
    if (loginActivities.length > 0) {
      debug.log("First activity:", {
        id: loginActivities[0].id,
        loginAt: loginActivities[0].loginAt,
        browser: loginActivities[0].browser,
        location: loginActivities[0].location,
      });
    } else {
      debug.log("No login activities found for this user");
    }
  } catch (error) {
    debug.error("Error fetching login activities:", error);
    if (error instanceof Error) {
      debug.error("Error message:", error.message);
      debug.error("Error stack:", error.stack);
    }
    // Continue with empty array if there's an error
  }

  return (
    <main className="w-full">
      <LoginActivityClient loginActivities={loginActivities} />
    </main>
  );
}
