import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

// Use the singleton Prisma client instance

export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;

  // Only apply this middleware to the signup page
  if (path === "/signup") {
    try {
      // Get site settings
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
        select: {
          googleLoginEnabled: true,
          manualSignupEnabled: true,
        },
      });

      // Default settings if none exist
      const googleLoginEnabled = settings?.googleLoginEnabled ?? true;
      const manualSignupEnabled = settings?.manualSignupEnabled ?? true;

      // Redirect to login page if manual signup is disabled
      // This covers both cases: when manual signup is disabled entirely,
      // and when only Google login is enabled
      if (!manualSignupEnabled) {
        debug.log("Redirecting to login: Manual signup is disabled or only Google login is enabled");
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      debug.error("Error checking site settings:", error);
      // In case of error, allow access to signup page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signup"],
};
