import { validateRequest } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

export async function middleware(request: NextRequest) {
  try {
    // Get the current pathname
    const pathname = request.nextUrl.pathname;

    // Validate the user's session
    const { user } = await validateRequest();

    // If no user is logged in, allow the request to proceed
    // (they'll be redirected to login by other middleware if needed)
    if (!user) {
      return NextResponse.next();
    }

    // Check if the user has the USER role
    // Only users with the USER role are allowed to access the frontend
    if (user.role !== "USER") {
      // Redirect to access denied page
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // User has the correct role, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    debug.error("Error in main middleware:", error);
    // If there's an error, allow the request to proceed
    // This prevents the application from breaking if there's an issue with the middleware
    return NextResponse.next();
  }
}

export const config = {
  // Apply this middleware to all routes in the (main) group
  matcher: ["/((?!api|admin|login|signup|access-denied|_next/static|_next/image|favicon.ico).*)"],
};
