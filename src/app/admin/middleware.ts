import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import debug from "@/lib/debug";

export async function middleware(request: NextRequest) {
  try {
    // Get the current pathname
    const pathname = request.nextUrl.pathname;

    // Skip middleware for login page to prevent redirect loops
    if (pathname === "/admin/login" || pathname === "/admin/logout") {
      return NextResponse.next();
    }

    // For all other admin pages, check authentication
    const { user } = await validateRequest();

    // Check if user is authenticated and has appropriate role
    const hasAdminAccess = user && (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "SUPER_ADMIN"
    );

    if (!hasAdminAccess) {
      // Redirect to admin login page if not authenticated or doesn't have admin access
      const redirectPath = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`/admin-login?redirect=${redirectPath}`, request.url));
    }

    // Check for specific path permissions
    // Management Users section is only accessible to SUPER_ADMIN
    if (pathname.startsWith('/admin/management-users') && user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // For other paths, check if the user has the required permissions
    // This is a more granular check beyond just role-based access
    if (user.role !== 'SUPER_ADMIN') { // Super admins bypass permission checks
      let requiredPermission = '';

      // Map paths to required permissions
      if (pathname.startsWith('/admin/users')) {
        requiredPermission = 'view_users';
      } else if (pathname.startsWith('/admin/posts')) {
        requiredPermission = 'view_posts';
      } else if (pathname.startsWith('/admin/competitions')) {
        requiredPermission = 'view_competitions';
      } else if (pathname.startsWith('/admin/pages')) {
        requiredPermission = 'view_pages';
      } else if (pathname.startsWith('/admin/payments')) {
        requiredPermission = 'view_payments';
      } else if (pathname.startsWith('/admin/settings')) {
        requiredPermission = 'manage_settings';
      }

      // If a permission is required for this path, check if the user has it
      if (requiredPermission) {
        // Get user permissions from database
        const userPermissions = await prisma.userPermission.findMany({
          where: { userId: user.id },
          include: { permission: true },
        });

        const hasPermission = userPermissions.some(
          up => up.permission.name === requiredPermission
        );

        if (!hasPermission) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
      }
    }

    // Continue with the request
    return NextResponse.next();
  } catch (error) {
    debug.error("Error in admin middleware:", error);
    // If there's an error, redirect to the admin login page
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }
}

export const config = {
  // Define which paths the middleware applies to
  // Explicitly exclude the auth route group to prevent redirect loops
  matcher: [
    // Match the exact /admin path
    "/admin",
    // Match all /admin/ paths EXCEPT those in the (auth) route group
    "/admin/:path*",
  ],
};

// Note: This middleware does not apply to API routes under /api/admin/
// Those routes have their own authentication checks

// The middleware is applied to all /admin routes and redirects to the admin login page
// if the user is not authenticated or not an admin.
