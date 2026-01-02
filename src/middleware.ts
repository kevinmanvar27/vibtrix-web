import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import debug from './lib/debug';
import { SECURITY_HEADERS, generateCSPNonce, getClientIP } from './lib/security';
import { applyRateLimit } from './lib/rate-limit';

// This middleware runs on all routes
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);

  // Apply rate limiting based on endpoint type
  let rateLimitType: 'auth' | 'api' | 'upload' | 'admin' | 'default' = 'default';

  if (pathname.startsWith('/api/auth/')) {
    rateLimitType = 'auth';
  } else if (pathname.startsWith('/api/upload/')) {
    rateLimitType = 'upload';
  } else if (pathname.startsWith('/api/admin/')) {
    rateLimitType = 'admin';
  } else if (pathname.startsWith('/api/')) {
    rateLimitType = 'api';
  }

  // Check rate limits (skip for media files)
  if (!pathname.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i)) {
    const rateLimitResult = applyRateLimit(request, rateLimitType);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
      return rateLimitResult.response;
    }
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Add comprehensive security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add additional security headers for 100% security
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // More permissive policies for payment pages to allow Razorpay
  const isPaymentRelated = pathname.includes('/competitions') ||
                          pathname.includes('/payment') ||
                          pathname.startsWith('/api/payments') ||
                          pathname.includes('/participate') ||
                          pathname.includes('/checkout') ||
                          pathname.includes('/admin') ||
                          pathname === '/' ||  // Allow on homepage for competition cards
                          pathname.startsWith('/users/') ||  // Allow on user pages
                          pathname.startsWith('/api/competitions') ||  // Allow on competition API calls
                          request.headers.get('referer')?.includes('/competitions');

  // Debug log to check if payment-related detection is working
  if (isPaymentRelated) {
    debug.log(`🔓 Payment-related page detected: ${pathname} - Using permissive policies`);
  }

  if (isPaymentRelated) {
    // Allow payment functionality and be more permissive for Razorpay
    response.headers.set('Permissions-Policy', 'camera=*, microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://*.razorpay.com")');
    response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none'); // More permissive for Razorpay
    response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none'); // Allow popups for payment
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin resources

    // Add cache-busting headers to ensure fresh policy application
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else {
    // Strict security for other pages
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  }

  // Generate CSP nonce for inline scripts
  const nonce = generateCSPNonce();

  // Handle media content with secure CORS
  const path = request.nextUrl.pathname;
  const isMediaRequest = path.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i);
  const isUploadRequest = path.startsWith('/uploads/');

  if (isMediaRequest || isUploadRequest) {
    debug.log(`Setting secure media headers for: ${path}`);

    // Add secure CORS headers for media files (restrict to same origin in production)
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'
      : request.headers.get('origin') || '*';

    response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
    response.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

    // Set proper content type for video files
    if (path.match(/\.(mp4)$/i)) {
      response.headers.set('Content-Type', 'video/mp4');
    } else if (path.match(/\.(webm)$/i)) {
      response.headers.set('Content-Type', 'video/webm');
    } else if (path.match(/\.(mov)$/i)) {
      response.headers.set('Content-Type', 'video/quicktime');
    }

    // Enable partial content requests for video streaming
    response.headers.set('Accept-Ranges', 'bytes');

    // Prevent content from being downloaded
    response.headers.set('Content-Disposition', 'inline');
    response.headers.set('X-Download-Options', 'noopen');

    // Use a more permissive caching policy for media files
    response.headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  }

  // Add enhanced Content Security Policy - more permissive for Next.js and Razorpay
  // Note: Next.js uses inline scripts for hydration, so we need 'unsafe-inline' without nonce
  // When nonce is present with 'unsafe-inline', browsers ignore 'unsafe-inline' per CSP spec
  let cspPolicy;

  if (isPaymentRelated) {
    // Very permissive CSP for payment pages to allow Razorpay to work
    cspPolicy = process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://*.razorpay.com; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://*.razorpay.com https://utfs.io; font-src 'self' data: https://*.razorpay.com; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: https://*; object-src 'none'; frame-src https://*.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.razorpay.com;`
      : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://*.razorpay.com; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://*.razorpay.com https://utfs.io; font-src 'self' data: https://*.razorpay.com; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: http://localhost:* https://*; object-src 'none'; frame-src https://*.razorpay.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.razorpay.com;`;
  } else {
    // Standard CSP for other pages - allow inline scripts for Next.js hydration
    cspPolicy = process.env.NODE_ENV === 'production'
      ? `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://utfs.io; font-src 'self' data:; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: https://*; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
      : `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.dicebear.com https://api.qrserver.com https://utfs.io; font-src 'self' data:; connect-src 'self' https://*.uploadthing.com https://utfs.io https://api.razorpay.com https://*.razorpay.com; media-src 'self' blob: http://localhost:* https://*; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`;
  }

  response.headers.set('Content-Security-Policy', cspPolicy);

  // Add CSP nonce to response for use in components
  response.headers.set('X-CSP-Nonce', nonce);

  debug.log(`Middleware processed request for: ${pathname}`);
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  // Apply this middleware to all routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
