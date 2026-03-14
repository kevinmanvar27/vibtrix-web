/**
 * Redis-based Rate Limiting Implementation
 * For production use with multiple server instances
 */

import { NextRequest } from 'next/server';
import debug from './debug';

// Redis client type for flexible implementation
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttl?: number): Promise<string | null>;
  del(key: string): Promise<number>;
  ttl?(key: string): Promise<number>;
}

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Configuration for different endpoint types
const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.',
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 2000,
    message: 'Too many API requests. Please try again later.',
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many file uploads. Please try again later.',
  },
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 requests per window (increased from 10 for normal admin usage)
    message: 'Too many admin requests. Please try again later.',
  },
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests. Please try again later.',
  },
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

// Get Redis client from environment
let redisClient: RedisClient | null = null;

export function initializeRedisRateLimiter(client: RedisClient) {
  redisClient = client;
  debug.log('Redis rate limiter initialized');
}

export function getRedisClient(): RedisClient | null {
  return redisClient;
}

/**
 * Check rate limit using Redis
 */
export async function checkRateLimitWithRedis(
  identifier: string,
  type: RateLimitType = 'default'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!redisClient) {
    // Fallback to in-memory rate limiting if Redis is not available
    debug.warn('Redis not available, falling back to in-memory rate limiting');
    return fallbackInMemoryRateLimit(identifier, type);
  }

  try {
    // Get current request count in this window
    const currentCount = await redisClient.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= config.maxRequests) {
      // Rate limit exceeded
      const ttlFn = redisClient.ttl;
      let retryAfter = Math.ceil(config.windowMs / 1000);
      
      if (ttlFn) {
        const ttl = await ttlFn.call(redisClient, key);
        if (ttl > 0) {
          retryAfter = ttl;
        }
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: now + retryAfter * 1000,
        retryAfter,
      };
    }

    // Increment counter and set expiry
    const newCount = count + 1;
    const pipeline = [];
    
    pipeline.push(redisClient.set(key, newCount.toString(), 'NX'));
    pipeline.push(redisClient.set(key, newCount.toString(), 'XX', config.windowMs));
    
    await Promise.all(pipeline);

    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetTime: now + config.windowMs,
    };
  } catch (error) {
    debug.error('Redis rate limit check failed:', error);
    // Fallback to in-memory on error
    return fallbackInMemoryRateLimit(identifier, type);
  }
}

/**
 * Fallback in-memory rate limiting (for development or Redis failures)
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function fallbackInMemoryRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.resetTime < now) {
    memoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
      retryAfter: Math.ceil((current.resetTime - now) / 1000),
    };
  }

  current.count++;
  memoryStore.set(key, current);

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Apply rate limiting to a request (auto-detects Redis availability)
 */
export function applyRateLimit(
  req: NextRequest,
  type: RateLimitType = 'default'
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  response?: Response;
} {
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   'unknown';
  
  const config = RATE_LIMIT_CONFIGS[type];
  const identifier = `${clientIP}`;

  // Check if we should use Redis
  if (redisClient) {
    // Async rate limiting with Redis
    // Note: In middleware context, we need to handle this synchronously
    // So we'll use the in-memory fallback for now
    // Redis can be used in API routes directly
    debug.log(`Using in-memory rate limiting for ${type} endpoint`);
  }

  // Use in-memory rate limiting (synchronous for middleware)
  const result = fallbackInMemoryRateLimit(identifier, type);

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        error: config.message,
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    );

    return { ...result, response };
  }

  return result;
}

/**
 * Clean up expired entries from memory store
 */
export function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key);
    }
  }
}

// Periodic cleanup (every 5 minutes)
if (typeof globalThis !== 'undefined') {
  setInterval(cleanupMemoryStore, 5 * 60 * 1000);
}
