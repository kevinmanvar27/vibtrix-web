/**
 * Advanced Rate Limiting Implementation
 * Provides multiple rate limiting strategies for different endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, checkRateLimit } from './security';
import debug from './debug';

// Rate limit configurations for different endpoint types
const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per window (increased from 5)
    message: 'Too many authentication attempts. Please try again later.',
  },

  // API endpoints - more generous limits for social media usage
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000, // 2000 requests per window (increased from 500)
    message: 'Too many API requests. Please try again later.',
  },

  // File upload endpoints - moderate limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 uploads per hour (increased from 20)
    message: 'Too many file uploads. Please try again later.',
  },

  // Admin endpoints - very strict limits
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per window
    message: 'Too many admin requests. Please try again later.',
  },

  // Password reset - very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
    message: 'Too many password reset attempts. Please try again later.',
  },

  // Email verification - moderate limits
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 attempts per hour
    message: 'Too many verification email requests. Please try again later.',
  },

  // OTP verification - stricter to prevent brute force
  otpVerification: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per window
    message: 'Too many verification attempts. Please try again later.',
  },

  // Default for other endpoints
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per window (increased for social media usage)
    message: 'Too many requests. Please try again later.',
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
  firstRequest: number;
}>();

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Clear all rate limit entries (for development/testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
  debug.log('Rate limit store cleared');
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  req: NextRequest,
  type: RateLimitType = 'default'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  response?: NextResponse;
} {
  const config = RATE_LIMIT_CONFIGS[type];
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  const now = Date.now();

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }

  const current = rateLimitStore.get(key);

  if (!current || current.resetTime < now) {
    // First request or window expired
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
      firstRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  if (current.count >= config.maxRequests) {
    // Rate limit exceeded
    const response = NextResponse.json(
      {
        error: config.message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString());
    response.headers.set('Retry-After', Math.ceil((current.resetTime - now) / 1000).toString());

    debug.log(`Rate limit exceeded for ${clientIP} on ${type} endpoint`);

    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      response,
    };
  }

  // Increment counter
  current.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(type: RateLimitType = 'default') {
  return (req: NextRequest): NextResponse | null => {
    const result = applyRateLimit(req, type);

    if (!result.allowed && result.response) {
      return result.response;
    }

    return null; // Allow request to continue
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number,
  limit: number
): void {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
}

/**
 * Check if IP is in whitelist (for admin IPs, etc.)
 */
export function isWhitelistedIP(ip: string): boolean {
  const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  return whitelistedIPs.includes(ip);
}

/**
 * Advanced rate limiting with sliding window
 */
export class SlidingWindowRateLimit {
  private requests = new Map<string, number[]>();

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Remove requests outside the window
    const validRequests = requests.filter(time => time > windowStart);

    // Check if we're under the limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

/**
 * Distributed rate limiting (for use with Redis in production)
 */
export interface DistributedRateLimitConfig {
  redis?: any; // Redis client
  keyPrefix?: string;
  windowMs: number;
  maxRequests: number;
}

export class DistributedRateLimit {
  constructor(private config: DistributedRateLimitConfig) {}

  async isAllowed(identifier: string): Promise<boolean> {
    if (!this.config.redis) {
      // Fallback to in-memory rate limiting
      return checkRateLimit(identifier).allowed;
    }

    const key = `${this.config.keyPrefix || 'rl'}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Use Redis sorted sets for sliding window
    const pipeline = this.config.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await pipeline.exec();
    const count = results[1][1] as number;

    return count < this.config.maxRequests;
  }
}

export { RATE_LIMIT_CONFIGS };
