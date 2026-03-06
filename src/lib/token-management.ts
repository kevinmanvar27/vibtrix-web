/**
 * Enhanced Token Management
 * Provides token cleanup, rotation, and security features
 */

import prisma from './prisma';
import debug from './debug';

/**
 * Clean up expired refresh tokens from database
 * Should be called periodically (e.g., daily cron job)
 */
export async function cleanupExpiredTokens(): Promise<{ deleted: number }> {
  try {
    const now = new Date();
    
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    
    debug.log(`Cleaned up ${result.count} expired refresh tokens`);
    return { deleted: result.count };
  } catch (error) {
    debug.error('Error cleaning up expired tokens:', error);
    throw new Error('Failed to clean up expired tokens');
  }
}

/**
 * Revoke all refresh tokens for a user
 * Useful when user changes password or security event occurs
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
    
    debug.log(`Revoked all refresh tokens for user ${userId}`);
  } catch (error) {
    debug.error('Error revoking user tokens:', error);
    throw new Error('Failed to revoke user tokens');
  }
}

/**
 * Check if user has too many active sessions
 * Returns true if limit exceeded
 */
export async function hasTooManyActiveSessions(
  userId: string,
  maxSessions: number = 10
): Promise<boolean> {
  try {
    const activeSessionCount = await prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    
    return activeSessionCount >= maxSessions;
  } catch (error) {
    debug.error('Error checking active sessions:', error);
    return false; // Fail open - don't block login on error
  }
}

/**
 * Remove oldest session if user has too many active sessions
 * Maintains session limit by removing the oldest one
 */
export async function enforceSessionLimit(
  userId: string,
  maxSessions: number = 10
): Promise<void> {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        expiresAt: 'asc', // Oldest first
      },
      take: 1,
    });
    
    if (sessions.length > 0) {
      await prisma.session.delete({
        where: {
          id: sessions[0].id,
        },
      });
      
      debug.log(`Removed oldest session for user ${userId} to enforce limit`);
    }
  } catch (error) {
    debug.error('Error enforcing session limit:', error);
  }
}

/**
 * Validate user account status during authentication
 * Ensures user account is active and in good standing
 */
export async function validateUserAccountStatus(userId: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        role: true,
      },
    });
    
    if (!user) {
      return {
        isValid: false,
        reason: 'User not found',
      };
    }
    
    if (!user.isActive) {
      return {
        isValid: false,
        reason: 'Account is deactivated',
      };
    }
    
    return { isValid: true };
  } catch (error) {
    debug.error('Error validating user account:', error);
    return {
      isValid: false,
      reason: 'Unable to validate account',
    };
  }
}

/**
 * Get active session count for a user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  try {
    return await prisma.session.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  } catch (error) {
    debug.error('Error getting active session count:', error);
    return 0;
  }
}

/**
 * Log security event for audit trail
 */
export async function logSecurityEvent(
  userId: string,
  eventType: 'PASSWORD_CHANGE' | 'TOKEN_REVOCATION' | 'SUSPICIOUS_ACTIVITY' | 'LOGIN' | 'LOGOUT',
  details?: Record<string, any>
): Promise<void> {
  try {
    // This would ideally go to a dedicated security_events table
    // For now, we'll use user_login_activities as a placeholder
    await prisma.userLoginActivity.create({
      data: {
        userId,
        status: eventType === 'SUSPICIOUS_ACTIVITY' ? 'FAILED' : 'SUCCESS',
        userAgent: details?.userAgent || null,
        ipAddress: details?.ipAddress || null,
      },
    });
    
    debug.log(`Security event logged: ${eventType} for user ${userId}`);
  } catch (error) {
    debug.error('Error logging security event:', error);
    // Don't throw - logging failure shouldn't break the flow
  }
}

/**
 * Rotate session - invalidate old session and create new one
 * Used for session rotation on sensitive operations
 */
export async function rotateSession(
  oldSessionId: string,
  userId: string
): Promise<{ newSessionId: string; expiresAt: Date }> {
  try {
    // Invalidate old session
    await prisma.session.update({
      where: { id: oldSessionId },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });
    
    // Create new session with explicit ID
    const newSessionId = crypto.randomUUID();
    const newSession = await prisma.session.create({
      data: {
        id: newSessionId,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    
    debug.log(`Session rotated for user ${userId}`);
    
    return {
      newSessionId: newSession.id,
      expiresAt: newSession.expiresAt,
    };
  } catch (error) {
    debug.error('Error rotating session:', error);
    throw new Error('Failed to rotate session');
  }
}
