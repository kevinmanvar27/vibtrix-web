import { Shield } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import LoginActivityClient from "./LoginActivityClient";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";

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

  // Get the user's login activity using Prisma (database-agnostic)
  let loginActivities: any[] = [];
  try {
    debug.log("Fetching login activities for user ID:", user.id);

    // Use Prisma's native query methods for MySQL compatibility
    const activities = await prisma.userLoginActivity.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        loginAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        browser: true,
        operatingSystem: true,
        deviceType: true,
        deviceBrand: true,
        deviceModel: true,
        location: true,
        city: true,
        region: true,
        country: true,
        loginAt: true,
        status: true,
      },
    });

    loginActivities = activities;

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
