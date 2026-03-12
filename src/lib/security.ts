/**
 * Comprehensive Security Library for Vibtrix
 * Implements security best practices and utilities
 */

import { NextRequest } from 'next/server';
import debug from './debug';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,

  // File upload limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],

  // JWT configuration
  JWT_ALGORITHM: 'HS256' as const,
  ACCESS_TOKEN_EXPIRY: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRY || '3600'),
  REFRESH_TOKEN_EXPIRY: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRY || '604800'),

  // Encryption
  ENCRYPTION_ALGORITHM: 'aes-256-gcm' as const,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using Argon2 (handled by @node-rs/argon2)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`);
  }

  if (password.length > SECURITY_CONFIG.MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be no more than ${SECURITY_CONFIG.MAX_PASSWORD_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Check file type
  const isValidImage = SECURITY_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
  const isValidVideo = SECURITY_CONFIG.ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isValidImage && !isValidVideo) {
    errors.push('Invalid file type. Only images and videos are allowed.');
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const expectedExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'video/quicktime': ['mov'],
  };

  const validExtensions = expectedExtensions[file.type as keyof typeof expectedExtensions];
  if (validExtensions && extension && !validExtensions.includes(extension)) {
    errors.push('File extension does not match file type');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting implementation
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;

  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  const current = rateLimitStore.get(identifier);

  if (!current || current.resetTime < now) {
    // First request or window expired
    const resetTime = now + SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime,
    };
  }

  if (current.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  current.count++;

  return {
    allowed: true,
    remaining: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Get client IP address for rate limiting
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return req.ip || 'unknown';
}

/**
 * Encrypt sensitive data
 */
export async function encryptData(data: string): Promise<string> {
  if (!SECURITY_CONFIG.ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import the key
  const keyBuffer = encoder.encode(SECURITY_CONFIG.ENCRYPTION_KEY.slice(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Array.from(combined, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encryptedData: string): Promise<string> {
  if (!SECURITY_CONFIG.ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }

  // Convert hex string back to bytes
  const combined = new Uint8Array(encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Import the key
  const keyBuffer = encoder.encode(SECURITY_CONFIG.ENCRYPTION_KEY.slice(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}

/**
 * Generate Content Security Policy nonce
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Validate and sanitize URL
 */
export function validateURL(url: string): boolean {
  try {
    const parsedURL = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    return allowedProtocols.includes(parsedURL.protocol);
  } catch {
    return false;
  }
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

export { SECURITY_CONFIG };
