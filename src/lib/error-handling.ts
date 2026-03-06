/**
 * Error Handling Utilities for API Routes
 * Provides consistent error handling without exposing sensitive information
 */

import debug from './debug';

/**
 * Standardized API error response
 */
export interface ApiError {
  error: string;
  message?: string;
  code?: string;
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  DATABASE = 'DATABASE_ERROR',
  SERVER = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  BAD_REQUEST = 'BAD_REQUEST_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
}

/**
 * Safe error handler that doesn't expose internal details
 * Logs full error internally but returns generic response to client
 */
export function handleApiError(
  error: unknown,
  context: string = 'API operation'
): { status: number; error: ApiError } {
  // Log the full error internally for debugging
  debug.error(`${context} failed:`, error);
  
  // Handle known error types
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Validation errors - user's fault
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return {
        status: 400,
        error: {
          error: 'Validation failed',
          message: 'The request contains invalid data',
          code: ErrorType.VALIDATION,
        },
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      return {
        status: 401,
        error: {
          error: 'Authentication required',
          message: 'Please log in to continue',
          code: ErrorType.AUTHENTICATION,
        },
      };
    }
    
    // Authorization errors
    if (errorMessage.includes('permission') || errorMessage.includes('forbidden') || errorMessage.includes('access')) {
      return {
        status: 403,
        error: {
          error: 'Access denied',
          message: 'You do not have permission to perform this action',
          code: ErrorType.AUTHORIZATION,
        },
      };
    }
    
    // Not found errors
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return {
        status: 404,
        error: {
          error: 'Resource not found',
          message: 'The requested resource could not be found',
          code: ErrorType.NOT_FOUND,
        },
      };
    }
    
    // Database errors - don't expose details
    if (errorMessage.includes('database') || errorMessage.includes('prisma') || errorMessage.includes('sql')) {
      debug.error('Database error details:', error.message);
      return {
        status: 500,
        error: {
          error: 'Database error',
          message: 'An error occurred while accessing the database',
          code: ErrorType.DATABASE,
        },
      };
    }
    
    // Rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return {
        status: 429,
        error: {
          error: 'Too many requests',
          message: 'Please slow down and try again later',
          code: ErrorType.RATE_LIMIT,
        },
      };
    }
    
    // Conflict errors
    if (errorMessage.includes('conflict') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return {
        status: 409,
        error: {
          error: 'Conflict',
          message: 'This resource already exists or conflicts with another',
          code: ErrorType.CONFLICT,
        },
      };
    }
  }
  
  // Default: Internal server error (don't expose details)
  return {
    status: 500,
    error: {
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      code: ErrorType.SERVER,
    },
  };
}

/**
 * Create a safe error response
 * Use this in catch blocks to avoid exposing sensitive information
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  defaultStatus: number = 500
): Response {
  const { status, error: apiError } = handleApiError(error, defaultMessage);
  
  return Response.json(apiError, { 
    status: Math.min(status, defaultStatus) // Use the more specific status
  });
}

/**
 * Wrap an async function with standardized error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string = 'Operation'
): Promise<{ success: true; data: T } | { success: false; error: ApiError; status: number }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const { status, error: apiError } = handleApiError(error, context);
    return { success: false, error: apiError, status };
  }
}

/**
 * Log error with context but return safe message
 * Useful for background operations that shouldn't fail the request
 */
export function logErrorSafely(
  error: unknown,
  context: string,
  fallbackMessage: string = 'Operation completed with warnings'
): string {
  debug.error(`${context} error:`, error);
  return fallbackMessage;
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: unknown, type: ErrorType): boolean {
  if (!(error instanceof Error)) return false;
  
  const { error: apiError } = handleApiError(error);
  return apiError.code === type;
}

/**
 * Sanitize error messages for logging
 * Removes potentially sensitive information from error messages
 */
export function sanitizeErrorMessage(error: string): string {
  // Remove file paths
  let sanitized = error.replace(/\/[^\s]+/g, '[PATH]');
  
  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // Remove potential API keys/secrets (basic pattern)
  sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[SECRET]');
  
  // Remove SQL queries (basic pattern)
  sanitized = sanitized.replace(/SELECT.*?FROM/gi, '[SQL QUERY]');
  
  return sanitized;
}
