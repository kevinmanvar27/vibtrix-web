/**
 * Security Headers Middleware
 * Ensures consistent security headers on all API responses
 */

import { NextResponse } from 'next/server';
import { SECURITY_HEADERS, generateCSPNonce } from './security';

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  options?: {
    isPaymentRelated?: boolean;
    isMediaRequest?: boolean;
    customCSP?: string;
  }
): NextResponse {
  // Apply base security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Download-Options', 'noopen');
  
  // Generate CSP nonce
  const nonce = generateCSPNonce();
  response.headers.set('X-CSP-Nonce', nonce);
  
  // Handle payment-related pages (more permissive for Razorpay)
  if (options?.isPaymentRelated) {
    applyPaymentHeaders(response, nonce);
  } else {
    applyStandardCSP(response, nonce);
  }
  
  // Handle media requests
  if (options?.isMediaRequest) {
    applyMediaHeaders(response);
  }
  
  // Apply custom CSP if provided
  if (options?.customCSP) {
    response.headers.set('Content-Security-Policy', options.customCSP);
  }
  
  return response;
}

/**
 * Apply payment-specific headers (permissive for Razorpay)
 */
function applyPaymentHeaders(response: NextResponse, nonce: string): void {
  response.headers.set(
    'Permissions-Policy',
    'camera=*, microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://*.razorpay.com")'
  );
  
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Cache-busting for fresh policy application
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Payment-specific CSP
  const cspPolicy = process.env.NODE_ENV === 'production'
    ? `default-src 'self'; script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://*.razorpay.com; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://*.razorpay.com https://utfs.io; font-src 'self' data: https://*.razorpay.com; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: https://*; object-src 'none'; frame-src https://*.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.razorpay.com;`
    : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com 'nonce-${nonce}'; style-src 'self' 'unsafe-inline' https://*.razorpay.com; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://*.razorpay.com https://utfs.io; font-src 'self' data: https://*.razorpay.com; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: http://localhost:* https://*; object-src 'none'; frame-src https://*.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.razorpay.com;`;
  
  response.headers.set('Content-Security-Policy', cspPolicy);
}

/**
 * Apply standard CSP for non-payment pages
 */
function applyStandardCSP(response: NextResponse, nonce: string): void {
  const cspPolicy = process.env.NODE_ENV === 'production'
    ? `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://utfs.io; font-src 'self' data:; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: https://*; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
    : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://utfs.io; font-src 'self' data:; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: http://localhost:* https://*; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  
  response.headers.set('Content-Security-Policy', cspPolicy);
}

/**
 * Apply media-specific headers
 */
function applyMediaHeaders(response: NextResponse): void {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  response.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  response.headers.set('Accept-Ranges', 'bytes');
  response.headers.set('Content-Disposition', 'inline');
  response.headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
}

/**
 * Create a response with security headers
 * Helper for creating new responses
 */
export function createSecureResponse(
  data: any,
  options?: {
    status?: number;
    isPaymentRelated?: boolean;
    isMediaRequest?: boolean;
    customCSP?: string;
  }
): NextResponse {
  const response = NextResponse.json(data, { 
    status: options?.status || 200 
  });
  
  return applySecurityHeaders(response, options);
}

/**
 * Create an error response with security headers
 */
export function createSecureError(
  error: string | { error: string; message?: string },
  status: number = 500,
  options?: {
    isPaymentRelated?: boolean;
  }
): NextResponse {
  const errorData = typeof error === 'string' 
    ? { error } 
    : error;
  
  const response = NextResponse.json(errorData, { status });
  
  return applySecurityHeaders(response, { 
    isPaymentRelated: options?.isPaymentRelated 
  });
}

/**
 * Validate Origin header for CSRF protection
 */
export function validateOrigin(request: Request): {
  isValid: boolean;
  origin?: string;
} {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (!origin) {
    // No origin header - could be same-origin or non-browser request
    return { isValid: true };
  }
  
  try {
    const originUrl = new URL(origin);
    const expectedHost = host || process.env.NEXT_PUBLIC_APP_URL;
    
    if (!expectedHost) {
      // Can't validate without expected host
      return { isValid: true, origin };
    }
    
    // Check if origin matches expected host
    if (originUrl.host === expectedHost || 
        originUrl.host === new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').host) {
      return { isValid: true, origin };
    }
    
    return { isValid: false, origin };
  } catch {
    // Invalid URL format
    return { isValid: false, origin };
  }
}

/**
 * Add CSRF validation headers checker
 */
export function checkCSRFHeaders(request: Request): {
  isValid: boolean;
  reason?: string;
} {
  // For state-changing methods, require CSRF headers
  const method = request.method;
  const csrfMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!csrfMethods.includes(method)) {
    return { isValid: true };
  }
  
  // Check for CSRF token in headers
  const csrfToken = request.headers.get('x-csrf-token') || 
                    request.headers.get('x-xsrf-token');
  
  if (!csrfToken) {
    // Also check for SameSite cookie protection
    // If using SameSite=strict cookies, CSRF tokens are less critical
    return { 
      isValid: true, // Allow for now - relies on SameSite cookie protection
      reason: 'No CSRF token found, relying on SameSite cookies' 
    };
  }
  
  // Token present - would need to validate against session
  // This is a placeholder for full CSRF validation
  return { isValid: true };
}
