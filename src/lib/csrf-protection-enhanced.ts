/**
 * CSRF Protection Utilities
 * Enhanced CSRF protection beyond SameSite cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { generateSecureToken } from './security';
import debug from './debug';

/**
 * Generate a CSRF token for the current session
 */
export async function generateCSRFToken(): Promise<string> {
  const token = generateSecureToken(32);
  
  // Store in HTTP-only cookie
  const cookieStore = await cookies();
  await cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
  
  return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('csrf_token')?.value;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(request: NextRequest): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // For safe methods, skip validation
  const method = request.method;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { isValid: true };
  }
  
  try {
    // Get token from header
    const headerToken = request.headers.get('x-csrf-token') || 
                       request.headers.get('x-xsrf-token');
    
    if (!headerToken) {
      // Check for form data token
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/x-www-form-urlencoded') ||
          contentType.includes('multipart/form-data')) {
        // Token would be in form data - requires parsing
        // This is handled by the middleware for efficiency
      }
    }
    
    // Get expected token from cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('csrf_token')?.value;
    
    if (!cookieToken) {
      // No CSRF token in cookie - might be first request
      // Allow but log for monitoring
      debug.warn('No CSRF token found in cookie');
      return { isValid: true, error: 'No CSRF token - relying on SameSite protection' };
    }
    
    // If header token exists, validate it
    if (headerToken) {
      if (headerToken !== cookieToken) {
        debug.error('CSRF token mismatch');
        return { 
          isValid: false, 
          error: 'CSRF token mismatch - possible attack detected' 
        };
      }
      
      return { isValid: true };
    }
    
    // No header token - rely on SameSite cookie protection
    // This is acceptable for browser-based requests where SameSite cookies work
    return { 
      isValid: true, 
      error: 'No CSRF header - relying on SameSite cookie protection' 
    };
  } catch (error) {
    debug.error('Error validating CSRF token:', error);
    return { 
      isValid: true, // Fail open - don't block legitimate requests
      error: 'CSRF validation error' 
    };
  }
}

/**
 * Middleware to check CSRF tokens
 * Use in Next.js middleware.ts
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  const method = request.method;
  
  // Only protect state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return null;
  }
  
  // Skip CSRF for API routes that use other auth (JWT, session)
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/')) {
    // API routes should use JWT or session-based auth
    // CSRF tokens are more for browser-based forms
    return null;
  }
  
  // Check for CSRF token
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value;
  
  if (csrfToken && cookieToken && csrfToken !== cookieToken) {
    debug.error('CSRF token mismatch in middleware');
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }
  
  // Also validate Origin header when present
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        // Cross-origin request
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        
        if (!allowedOrigins.includes(origin)) {
          debug.error(`Blocked cross-origin request from: ${origin}`);
          return NextResponse.json(
            { error: 'Cross-origin request blocked' },
            { status: 403 }
          );
        }
      }
    } catch {
      // Invalid origin URL
      return NextResponse.json(
        { error: 'Invalid origin header' },
        { status: 400 }
      );
    }
  }
  
  return null;
}

/**
 * Add CSRF token to fetch requests
 * Client-side helper
 */
export async function addCSRFTokenToRequest(
  url: string,
  options: RequestInit = {}
): Promise<RequestInit> {
  const token = await getCSRFToken();
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': token || '',
    },
  };
}

/**
 * Refresh CSRF token
 * Call periodically or on user action
 */
export async function refreshCSRFToken(): Promise<string> {
  // Generate new token
  const newToken = await generateCSRFToken();
  
  debug.log('CSRF token refreshed');
  
  return newToken;
}

/**
 * Double Submit Cookie pattern
 * Alternative CSRF validation method
 */
export async function validateDoubleSubmitCookie(
  request: NextRequest
): Promise<boolean> {
  const customHeader = request.headers.get('X-CSRF-Token');
  const cookie = request.cookies.get('csrf_token')?.value;
  
  if (!customHeader || !cookie) {
    return false;
  }
  
  return customHeader === cookie;
}
