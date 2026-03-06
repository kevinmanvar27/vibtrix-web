/**
 * Validation Middleware for API Routes
 * Provides consistent input validation across all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import debug from './debug';

/**
 * Validate request body using provided Zod schema
 * @param request - The Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated data or error response
 */
export async function validateRequestBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<{ data?: ZodSchema['_output']; error?: Response }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      debug.log('Validation failed:', error.errors);
      
      const errorResponse = Response.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          }))
        },
        { status: 400 }
      );
      
      return { error: errorResponse };
    }
    
    debug.error('Error parsing request body:', error);
    return { 
      error: Response.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    };
  }
}

/**
 * Validate query parameters using provided Zod schema
 * @param request - The Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated data or error response
 */
export async function validateQueryParams<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<{ data?: ZodSchema['_output']; error?: Response }> {
  try {
    const queryParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedData = schema.parse(queryParams);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      debug.log('Query parameter validation failed:', error.errors);
      
      const errorResponse = Response.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
      
      return { error: errorResponse };
    }
    
    debug.error('Error parsing query parameters:', error);
    return { 
      error: Response.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    };
  }
}

/**
 * Create a validated request handler wrapper
 * @param schema - Zod schema for request body validation
 * @param handler - The actual request handler function
 * @returns Wrapped handler with validation
 */
export function withValidation<T extends ZodSchema>(
  schema: T,
  handler: (request: NextRequest, validatedData: T['_output']) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const validationResult = await validateRequestBody(request, schema);
    
    if (validationResult.error) {
      return validationResult.error;
    }
    
    return handler(request, validationResult.data!);
  };
}

/**
 * Validate FormData using provided Zod schema
 * Useful for file uploads and multipart forms
 * @param request - The Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated data or error response
 */
export async function validateFormData<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<{ data?: ZodSchema['_output']; error?: Response }> {
  try {
    const formData = await request.formData();
    const entries: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      // Handle File objects
      if (value instanceof File) {
        entries[key] = {
          name: value.name,
          size: value.size,
          type: value.type,
          // You can add more file properties as needed
        };
      } else {
        entries[key] = value;
      }
    });
    
    const validatedData = schema.parse(entries);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      debug.log('FormData validation failed:', error.errors);
      
      const errorResponse = Response.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      );
      
      return { error: errorResponse };
    }
    
    debug.error('Error parsing FormData:', error);
    return { 
      error: Response.json(
        { error: 'Invalid form data' },
        { status: 400 }
      )
    };
  }
}

/**
 * Sanitize string input to prevent XSS
 * Basic sanitization - should be used in combination with CSP headers
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate pagination parameters
 * Common utility for list endpoints
 */
export const paginationSchema = {
  page: Number,
  limit: Number,
};

export function validatePaginationParams(
  request: NextRequest,
  maxLimit: number = 100
): { page: number; limit: number; error?: Response } {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
  
  if (isNaN(page) || page < 1) {
    return {
      page: 1,
      limit: 20,
      error: Response.json(
        { error: 'Invalid pagination parameters', page: 1, limit: 20 },
        { status: 400 }
      )
    };
  }
  
  if (isNaN(limit) || limit < 1 || limit > maxLimit) {
    return {
      page,
      limit: Math.min(limit, maxLimit),
      error: Response.json(
        { error: `Limit must be between 1 and ${maxLimit}`, page, limit: Math.min(limit, maxLimit) },
        { status: 400 }
      )
    };
  }
  
  return { page, limit };
}
