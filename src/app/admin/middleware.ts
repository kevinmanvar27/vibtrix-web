import { validateRequest } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import debug from "@/lib/debug";

// In-memory cache for user permissions to avoid database calls on every request
// Cache expires after 2 minutes or on server restart
const permissionsCache = new Map<string, {
  permissions: Set<string>;
  lastFetch: number;
}>();

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function getUserPermissions(userId: string): Promise<Set<string>> {
  const now = Date.now();
  const cached = permissionsCache.get(userId);
  
  // Return cached permissions if still valid
  if (cached && (now - cached.lastFetch) < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    // Lazy load prisma only when needed
    const prisma = (await import("@/lib/prisma")).default;
    
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const permissions = new Set(userPermissions.map(up => up.permission.name));
    
    // Update cache
    permissionsCache.set(userId, {
      permissions,
      lastFetch: now,
    });

    return permissions;
  } catch (error) {
    debug.error("Error fetching user permissions:", error);
    // Return empty set on error
    return new Set();
  }
}

export async function middleware(request: NextRequest) {
  try {
    // Get the current pathname
    const pathname = request.nextUrl.pathname;

    // Skip middleware for login/logout pages to prevent redirect loops
    if (pathname === "/admin-login" || pathname === "/admin/logout") {
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
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // For other paths, check if the user has the required permissions
    // Super admins bypass permission checks
    if (user.role !== 'SUPER_ADMIN') {
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
        // Get cached user permissions (fast)
        const userPermissions = await getUserPermissions(user.id);

        if (!userPermissions.has(requiredPermission)) {
          return NextResponse.redirect(new URL('/admin', request.url));
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
  matcher: [
    "/admin",
    "/admin/:path*",
  ],
};
