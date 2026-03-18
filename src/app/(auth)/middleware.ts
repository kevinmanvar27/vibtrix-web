import { NextRequest, NextResponse } from "next/server";
import debug from "@/lib/debug";

// Simple in-memory cache for site settings to avoid database calls in middleware
// This cache is refreshed every 5 minutes or on server restart
let settingsCache: {
  googleLoginEnabled: boolean;
  manualSignupEnabled: boolean;
  lastFetch: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSiteSettings() {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache && (now - settingsCache.lastFetch) < CACHE_TTL) {
    return settingsCache;
  }

  try {
    // Lazy load prisma only when needed
    const prisma = (await import("@/lib/prisma")).default;
    
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        googleLoginEnabled: true,
        manualSignupEnabled: true,
      },
    });

    // Update cache
    settingsCache = {
      googleLoginEnabled: settings?.googleLoginEnabled ?? true,
      manualSignupEnabled: settings?.manualSignupEnabled ?? true,
      lastFetch: now,
    };

    return settingsCache;
  } catch (error) {
    debug.error("Error fetching site settings:", error);
    // Return default settings on error
    return {
      googleLoginEnabled: true,
      manualSignupEnabled: true,
      lastFetch: now,
    };
  }
}

export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;

  // Only apply this middleware to the signup page
  if (path === "/signup") {
    try {
      // Get cached site settings (fast)
      const settings = await getSiteSettings();

      // Redirect to login page if manual signup is disabled
      if (!settings.manualSignupEnabled) {
        debug.log("Redirecting to login: Manual signup is disabled");
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch (error) {
      debug.error("Error in auth middleware:", error);
      // In case of error, allow access to signup page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signup"],
};
