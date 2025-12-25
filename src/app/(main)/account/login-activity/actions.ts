"use server";

import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { revalidatePath } from "next/cache";

import debug from "@/lib/debug";

/**
 * Create a test login activity record for the current user
 * This is for testing purposes only
 */
export async function createTestLoginActivity() {
  const { user } = await validateRequest();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    debug.log("Creating test login activity for user:", user.id);

    // Create a test login activity record
    const activity = await prisma.userLoginActivity.create({
      data: {
        userId: user.id,
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        browser: "Chrome",
        operatingSystem: "macOS",
        deviceType: "Desktop",
        deviceBrand: "Apple",
        deviceModel: "Mac",
        location: "Test Location",
        city: "Test City",
        region: "Test Region",
        country: "Test Country",
        status: "SUCCESS"
      }
    });

    debug.log("Test login activity created with ID:", activity.id);

    // Revalidate the login activity page
    revalidatePath("/account/login-activity");

    return { success: true, activityId: activity.id };
  } catch (error) {
    debug.error("Error creating test login activity:", error);
    // Log more details about the error
    if (error instanceof Error) {
      debug.error("Error message:", error.message);
      debug.error("Error stack:", error.stack);
    }

    return {
      error: "Failed to create test login activity",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
