/**
 * Enhanced Security Validation Library
 * Provides comprehensive input validation and sanitization
 */

import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";
import { sanitizeInput, validatePasswordStrength } from "./security";

// Enhanced validation schemas with security checks
const secureString = z.string().transform((val) => sanitizeInput(val));
const requiredSecureString = secureString.min(1, "Required");

// Username validation with security checks
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be no more than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .refine((val) => !val.includes('admin'), "Username cannot contain 'admin'")
  .refine((val) => !val.includes('root'), "Username cannot contain 'root'")
  .refine((val) => !val.includes('system'), "Username cannot contain 'system'")
  .transform((val) => sanitizeInput(val));

// Email validation with additional security
const emailSchema = z.string()
  .email("Invalid email address")
  .max(254, "Email address too long")
  .refine((email) => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\+.*\+/, // Multiple plus signs
      /\.{2,}/, // Multiple consecutive dots
      /@.*@/, // Multiple @ symbols
    ];
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  }, "Invalid email format")
  .transform((val) => val.toLowerCase().trim());

// Password validation with strength requirements
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be no more than 128 characters")
  .refine((password) => {
    const result = validatePasswordStrength(password);
    return result.isValid;
  }, "Password does not meet security requirements");

// Content validation with XSS protection
const contentSchema = z.string()
  .max(10000, "Content too long")
  .transform((val) => {
    // Sanitize HTML content
    return DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href'],
      ALLOW_DATA_ATTR: false,
    });
  });

// URL validation with security checks
const urlSchema = z.string()
  .url("Invalid URL")
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      // Only allow HTTP and HTTPS protocols
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }, "Invalid URL protocol")
  .refine((url) => {
    // Block suspicious domains
    const suspiciousDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
    ];
    
    try {
      const parsedUrl = new URL(url);
      return !suspiciousDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }, "URL contains suspicious domain");

// File validation schema
const fileSchema = z.object({
  name: z.string().min(1, "Filename required"),
  size: z.number().max(50 * 1024 * 1024, "File too large (max 50MB)"),
  type: z.string().refine((type) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];
    return allowedTypes.includes(type);
  }, "Invalid file type"),
});

// Enhanced schemas for the application
export const secureSignUpSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const secureLoginSchema = z.object({
  username: requiredSecureString,
  password: requiredSecureString,
});

export const secureCreatePostSchema = z.object({
  content: contentSchema.optional().default(""),
  mediaIds: z.array(z.string().uuid("Invalid media ID")).max(5, "Cannot have more than 5 attachments"),
});

export const secureUpdateUserProfileSchema = z.object({
  displayName: secureString.min(1, "Display name required").max(50, "Display name too long"),
  bio: contentSchema.max(500, "Bio too long").optional(),
  email: emailSchema.optional(),
  username: usernameSchema.optional(),
  avatarUrl: urlSchema.optional(),
  dateOfBirth: z.string().optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120; // Reasonable age limits
    }, "Invalid date of birth"),
  
  // Social links with validation
  socialLinks: z.object({
    website: urlSchema.optional(),
    twitter: z.string().optional().refine((val) => {
      if (!val) return true;
      return /^@?[a-zA-Z0-9_]{1,15}$/.test(val);
    }, "Invalid Twitter handle"),
    instagram: z.string().optional().refine((val) => {
      if (!val) return true;
      return /^@?[a-zA-Z0-9_.]{1,30}$/.test(val);
    }, "Invalid Instagram handle"),
    youtube: urlSchema.optional(),
    tiktok: z.string().optional().refine((val) => {
      if (!val) return true;
      return /^@?[a-zA-Z0-9_.]{1,24}$/.test(val);
    }, "Invalid TikTok handle"),
  }).optional(),

  // Modeling feature fields with validation
  interestedInModeling: z.boolean().optional().default(false),
  photoshootPricePerDay: z.number()
    .min(0, "Price cannot be negative")
    .max(1000000, "Price too high")
    .optional()
    .nullable(),
  videoAdsParticipation: z.boolean().optional().default(false),

  // Brand Ambassadorship feature fields with validation
  interestedInBrandAmbassadorship: z.boolean().optional().default(false),
  brandAmbassadorshipPricing: secureString.max(200, "Pricing info too long").optional().nullable(),
  brandPreferences: secureString.max(500, "Brand preferences too long").optional().nullable(),
});

export const secureCreateCommentSchema = z.object({
  content: contentSchema.min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

export const secureCompetitionSchema = z.object({
  title: secureString.min(1, "Title required").max(100, "Title too long"),
  description: contentSchema.max(2000, "Description too long"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  entryFee: z.number().min(0, "Entry fee cannot be negative").max(10000, "Entry fee too high"),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant").max(10000, "Too many participants"),
  ageRestriction: z.object({
    minAge: z.number().min(13, "Minimum age is 13").max(100, "Invalid minimum age"),
    maxAge: z.number().min(13, "Maximum age is 13").max(100, "Invalid maximum age"),
  }).optional(),
});

// SQL injection prevention
export function preventSQLInjection(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove or escape dangerous SQL keywords and characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
    .trim();
}

// XSS prevention for HTML content
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

// Path traversal prevention
export function sanitizePath(path: string): string {
  if (typeof path !== 'string') return '';
  
  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
}

// Validate and sanitize file uploads
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; errors: string[]; sanitizedName?: string } {
  const errors: string[] = [];
  
  try {
    fileSchema.parse(file);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(e => e.message));
    }
  }
  
  // Sanitize filename
  const sanitizedName = sanitizePath(file.name);
  
  // Additional filename checks
  if (sanitizedName.length === 0) {
    errors.push('Invalid filename');
  }
  
  if (sanitizedName.length > 255) {
    errors.push('Filename too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedName: errors.length === 0 ? sanitizedName : undefined,
  };
}

// Export types
export type SecureSignUpValues = z.infer<typeof secureSignUpSchema>;
export type SecureLoginValues = z.infer<typeof secureLoginSchema>;
export type SecureCreatePostValues = z.infer<typeof secureCreatePostSchema>;
export type SecureUpdateUserProfileValues = z.infer<typeof secureUpdateUserProfileSchema>;
export type SecureCreateCommentValues = z.infer<typeof secureCreateCommentSchema>;
export type SecureCompetitionValues = z.infer<typeof secureCompetitionSchema>;
