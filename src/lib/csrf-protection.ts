/**
 * CSRF (Cross-Site Request Forgery) Protection Library
 * Provides comprehensive CSRF protection for the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken } from './security';
import { cookies } from 'next/headers';
import debug from './debug';

// CSRF token configuration
const CSRF_CONFIG = {
  TOKEN_LENGTH: 32,
  TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
  COOKIE_NAME: 'csrf-token',
  HEADER_NAME: 'x-csrf-token',
  FORM_FIELD_NAME: '_csrf',
};

// In-memory store for CSRF tokens (in production, use Redis)
const csrfTokenStore = new Map<string, {
  token: string;
  expiresAt: number;
  sessionId?: string;
}>();

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const token = generateSecureToken(CSRF_CONFIG.TOKEN_LENGTH);
  const expiresAt = Date.now() + CSRF_CONFIG.TOKEN_EXPIRY;
  
  csrfTokenStore.set(token, {
    token,
    expiresAt,
    sessionId,
  });
  
  // Clean up expired tokens
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(
  token: string,
  sessionId?: string
): boolean {
  if (!token) {
    return false;
  }
  
  const storedToken = csrfTokenStore.get(token);
  
  if (!storedToken) {
    debug.log('CSRF token not found in store');
    return false;
  }
  
  // Check if token has expired
  if (storedToken.expiresAt < Date.now()) {
    csrfTokenStore.delete(token);
    debug.log('CSRF token has expired');
    return false;
  }
  
  // Check if session matches (if provided)
  if (sessionId && storedToken.sessionId && storedToken.sessionId !== sessionId) {
    debug.log('CSRF token session mismatch');
    return false;
  }
  
  return true;
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of csrfTokenStore.entries()) {
    if (data.expiresAt < now) {
      csrfTokenStore.delete(token);
    }
  }
}

/**
 * Set CSRF token in cookie
 */
export function setCSRFTokenCookie(token: string): void {
  const cookieStore = cookies();
  
  cookieStore.set(CSRF_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_CONFIG.TOKEN_EXPIRY / 1000,
    path: '/',
  });
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(CSRF_CONFIG.COOKIE_NAME);
    return token?.value || null;
  } catch (error) {
    debug.error('Error getting CSRF token from cookie:', error);
    return null;
  }
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeaders(req: NextRequest): string | null {
  return req.headers.get(CSRF_CONFIG.HEADER_NAME);
}

/**
 * Get CSRF token from form data
 */
export async function getCSRFTokenFromForm(req: NextRequest): Promise<string | null> {
  try {
    const formData = await req.formData();
    return formData.get(CSRF_CONFIG.FORM_FIELD_NAME) as string || null;
  } catch (error) {
    debug.error('Error getting CSRF token from form:', error);
    return null;
  }
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  req: NextRequest,
  options: {
    skipMethods?: string[];
    requireSessionMatch?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const method = req.method.toUpperCase();
  const skipMethods = options.skipMethods || ['GET', 'HEAD', 'OPTIONS'];
  
  // Skip CSRF protection for safe methods
  if (skipMethods.includes(method)) {
    return null;
  }
  
  // Get CSRF token from various sources
  let token = getCSRFTokenFromHeaders(req);
  
  if (!token && method === 'POST') {
    // For POST requests, also check form data
    try {
      token = await getCSRFTokenFromForm(req);
    } catch (error) {
      // If we can't parse form data, continue with header token
    }
  }
  
  if (!token) {
    debug.log('CSRF token missing from request');
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    );
  }
  
  // Get session ID if required
  let sessionId: string | undefined;
  if (options.requireSessionMatch) {
    const sessionCookie = req.cookies.get('auth-session');
    sessionId = sessionCookie?.value;
  }
  
  // Validate the token
  if (!validateCSRFToken(token, sessionId)) {
    debug.log('Invalid CSRF token');
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  return null; // Allow request to continue
}

/**
 * Generate CSRF token for forms
 */
export function generateCSRFTokenForForm(sessionId?: string): {
  token: string;
  hiddenInput: string;
} {
  const token = generateCSRFToken(sessionId);
  const hiddenInput = `<input type="hidden" name="${CSRF_CONFIG.FORM_FIELD_NAME}" value="${token}" />`;
  
  return { token, hiddenInput };
}

/**
 * CSRF protection for API routes
 */
export function createCSRFMiddleware(options: {
  skipMethods?: string[];
  requireSessionMatch?: boolean;
} = {}) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    return await csrfProtection(req, options);
  };
}

/**
 * Double submit cookie pattern implementation
 */
export class DoubleSubmitCSRF {
  private static readonly COOKIE_NAME = 'csrf-double-submit';
  private static readonly HEADER_NAME = 'x-csrf-double-submit';
  
  /**
   * Generate and set double submit CSRF token
   */
  static generateToken(): string {
    const token = generateSecureToken(32);
    
    // Set in cookie
    const cookieStore = cookies();
    cookieStore.set(this.COOKIE_NAME, token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    return token;
  }
  
  /**
   * Validate double submit CSRF token
   */
  static validateToken(req: NextRequest): boolean {
    const cookieToken = req.cookies.get(this.COOKIE_NAME)?.value;
    const headerToken = req.headers.get(this.HEADER_NAME);
    
    if (!cookieToken || !headerToken) {
      return false;
    }
    
    // Tokens must match exactly
    return cookieToken === headerToken;
  }
  
  /**
   * Middleware for double submit CSRF protection
   */
  static middleware(skipMethods: string[] = ['GET', 'HEAD', 'OPTIONS']) {
    return (req: NextRequest): NextResponse | null => {
      const method = req.method.toUpperCase();
      
      if (skipMethods.includes(method)) {
        return null;
      }
      
      if (!this.validateToken(req)) {
        debug.log('Double submit CSRF validation failed');
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        );
      }
      
      return null;
    };
  }
}

/**
 * SameSite cookie CSRF protection
 */
export class SameSiteCSRF {
  /**
   * Check if request has proper SameSite protection
   */
  static validateSameSite(req: NextRequest): boolean {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');
    
    // For same-site requests, origin should match host
    if (origin) {
      try {
        const originUrl = new URL(origin);
        return originUrl.host === host;
      } catch {
        return false;
      }
    }
    
    // Fallback to referer check
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Middleware for SameSite CSRF protection
   */
  static middleware(skipMethods: string[] = ['GET', 'HEAD', 'OPTIONS']) {
    return (req: NextRequest): NextResponse | null => {
      const method = req.method.toUpperCase();
      
      if (skipMethods.includes(method)) {
        return null;
      }
      
      if (!this.validateSameSite(req)) {
        debug.log('SameSite CSRF validation failed');
        return NextResponse.json(
          { error: 'Cross-site request detected' },
          { status: 403 }
        );
      }
      
      return null;
    };
  }
}

export { CSRF_CONFIG };
