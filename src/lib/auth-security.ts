/**
 * Enhanced Authentication Security Library
 * Provides secure authentication utilities and middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import { verifyJwtAuth } from './jwt-middleware';
import { applyRateLimit } from './rate-limit';
import { getClientIP } from './security';
import prisma from './prisma';
import debug from './debug';

// User roles hierarchy
export const USER_ROLES = {
  USER: 0,
  ADMIN: 1,
  MANAGER: 2,
  SUPER_ADMIN: 3,
} as const;

export type UserRole = keyof typeof USER_ROLES;

// Permission system
export const PERMISSIONS = {
  // User permissions
  READ_PROFILE: 'read:profile',
  UPDATE_PROFILE: 'update:profile',
  DELETE_PROFILE: 'delete:profile',
  
  // Post permissions
  CREATE_POST: 'create:post',
  READ_POST: 'read:post',
  UPDATE_POST: 'update:post',
  DELETE_POST: 'delete:post',
  
  // Admin permissions
  MANAGE_USERS: 'manage:users',
  MANAGE_POSTS: 'manage:posts',
  MANAGE_COMPETITIONS: 'manage:competitions',
  MANAGE_SETTINGS: 'manage:settings',
  
  // Super admin permissions
  MANAGE_ADMINS: 'manage:admins',
  SYSTEM_ACCESS: 'system:access',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Base permissions for each role
const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.READ_PROFILE,
  PERMISSIONS.UPDATE_PROFILE,
  PERMISSIONS.CREATE_POST,
  PERMISSIONS.READ_POST,
  PERMISSIONS.UPDATE_POST,
  PERMISSIONS.DELETE_POST,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.MANAGE_POSTS,
  PERMISSIONS.MANAGE_COMPETITIONS,
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  PERMISSIONS.MANAGE_SETTINGS,
];

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...MANAGER_PERMISSIONS,
  PERMISSIONS.MANAGE_ADMINS,
  PERMISSIONS.SYSTEM_ACCESS,
];

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: USER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

/**
 * Check if user has required permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has required role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return USER_ROLES[userRole] >= USER_ROLES[requiredRole];
}

/**
 * Secure authentication middleware for API routes
 */
export async function requireAuth(
  req: NextRequest,
  options: {
    requiredRole?: UserRole;
    requiredPermission?: Permission;
    allowGuest?: boolean;
  } = {}
): Promise<{
  user: any | null;
  error?: NextResponse;
}> {
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(req, 'api');
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return { user: null, error: rateLimitResult.response };
    }

    // Try JWT authentication first (for mobile apps)
    let user: any = await verifyJwtAuth(req);
    
    // Fallback to session-based authentication
    if (!user) {
      const sessionResult = await validateRequest();
      user = sessionResult.user;
    }

    // Check if authentication is required
    if (!user && !options.allowGuest) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    // Check role requirements
    if (user && options.requiredRole) {
      if (!hasRoleLevel(user.role as UserRole, options.requiredRole)) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          ),
        };
      }
    }

    // Check permission requirements
    if (user && options.requiredPermission) {
      if (!hasPermission(user.role as UserRole, options.requiredPermission)) {
        return {
          user: null,
          error: NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          ),
        };
      }
    }

    // Check if user account is active
    if (user && !user.isActive) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        ),
      };
    }

    return { user };
  } catch (error) {
    debug.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Track login attempts for security monitoring
 */
export async function trackLoginAttempt(
  req: NextRequest,
  username: string,
  success: boolean,
  userId: string
): Promise<void> {
  try {
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    
    await prisma.userLoginActivity.create({
      data: {
        userId,
        ipAddress: clientIP,
        userAgent,
        status: success ? 'SUCCESS' : 'FAILED',
        loginAt: new Date(),
      },
    });

    // Check for suspicious activity
    if (!success) {
      await checkSuspiciousActivity(clientIP, username);
    }
  } catch (error) {
    debug.error('Error tracking login attempt:', error);
  }
}

/**
 * Check for suspicious login activity
 */
async function checkSuspiciousActivity(
  ipAddress: string,
  _username: string
): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Check failed attempts from same IP
    const failedAttemptsFromIP = await prisma.userLoginActivity.count({
      where: {
        ipAddress,
        status: 'FAILED',
        loginAt: { gte: oneHourAgo },
      },
    });

    // Log suspicious activity
    if (failedAttemptsFromIP > 5) {
      debug.log(`Suspicious activity detected: ${failedAttemptsFromIP} failed attempts from IP ${ipAddress}`);
    }
  } catch (error) {
    debug.error('Error checking suspicious activity:', error);
  }
}

/**
 * Validate session security
 */
export async function validateSessionSecurity(
  sessionId: string,
  clientIP: string,
  userAgent: string
): Promise<boolean> {
  try {
    // Get session from database
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return false;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: sessionId } });
      return false;
    }

    // Check for session hijacking (IP change)
    const recentActivity = await prisma.userLoginActivity.findFirst({
      where: {
        userId: session.userId,
        status: 'SUCCESS',
      },
      orderBy: { loginAt: 'desc' },
    });

    if (recentActivity && recentActivity.ipAddress !== clientIP) {
      debug.log(`Potential session hijacking detected for user ${session.userId}: IP changed from ${recentActivity.ipAddress} to ${clientIP}`);
      // In production, you might want to invalidate the session here
    }

    return true;
  } catch (error) {
    debug.error('Error validating session security:', error);
    return false;
  }
}

/**
 * Generate secure session token
 */
export function generateSecureSessionToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Secure logout - invalidate all sessions
 */
export async function secureLogout(userId: string): Promise<void> {
  try {
    // Invalidate all sessions for the user
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    debug.log(`Secure logout completed for user ${userId}`);
  } catch (error) {
    debug.error('Error during secure logout:', error);
    throw error;
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(user: any): boolean {
  return user && (
    user.role === 'ADMIN' ||
    user.role === 'MANAGER' ||
    user.role === 'SUPER_ADMIN' ||
    user.isAdmin === true
  );
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: any): boolean {
  return user && user.role === 'SUPER_ADMIN';
}

/**
 * Middleware factory for protecting routes
 */
export function createAuthMiddleware(options: {
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  allowGuest?: boolean;
} = {}) {
  return async (req: NextRequest) => {
    const result = await requireAuth(req, options);
    return result.error || null;
  };
}
