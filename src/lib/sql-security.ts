/**
 * SQL Security and Injection Prevention Library
 * Provides utilities to prevent SQL injection attacks
 */

import { Prisma } from '@prisma/client';
import debug from './debug';

/**
 * SQL injection patterns to detect and prevent
 */
const SQL_INJECTION_PATTERNS = [
  // Basic SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
  
  // Comment patterns
  /(--|\#|\/\*|\*\/)/g,
  
  // Quote patterns
  /('|(\\')|('')|("|(\\"))|(""))/g,
  
  // Semicolon patterns (statement termination)
  /;/g,
  
  // Hex patterns
  /0x[0-9a-f]+/gi,
  
  // UNION attacks
  /\bunion\b.*\bselect\b/gi,
  
  // Boolean-based blind SQL injection
  /\b(and|or)\b.*\b(true|false|\d+\s*=\s*\d+)\b/gi,
  
  // Time-based blind SQL injection
  /\b(sleep|waitfor|delay)\b/gi,
  
  // Information schema attacks
  /\binformation_schema\b/gi,
  
  // System function calls
  /\b(system|exec|shell|cmd)\b/gi,
];

/**
 * Dangerous SQL keywords that should never appear in user input
 */
const DANGEROUS_SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
  'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT',
  'SUBSTRING', 'ASCII', 'CHAR', 'NCHAR', 'UNICODE', 'NVARCHAR',
  'INFORMATION_SCHEMA', 'SYSOBJECTS', 'SYSCOLUMNS', 'SYSUSERS',
  'SLEEP', 'WAITFOR', 'DELAY', 'BENCHMARK'
];

/**
 * Sanitize input to prevent SQL injection
 */
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove dangerous SQL keywords
  DANGEROUS_SQL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove SQL injection patterns
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validate input for potential SQL injection attempts
 */
export function validateSQLInput(input: string): {
  isValid: boolean;
  threats: string[];
} {
  const threats: string[] = [];

  if (typeof input !== 'string') {
    return { isValid: true, threats: [] };
  }

  // Check for dangerous keywords
  DANGEROUS_SQL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(input)) {
      threats.push(`Dangerous SQL keyword detected: ${keyword}`);
    }
  });

  // Check for injection patterns
  SQL_INJECTION_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      threats.push(`SQL injection pattern detected (pattern ${index + 1})`);
    }
  });

  return {
    isValid: threats.length === 0,
    threats,
  };
}

/**
 * Secure search query builder for Prisma
 */
export function buildSecureSearchQuery(
  searchTerm: string,
  fields: string[]
): Prisma.StringFilter {
  // Sanitize the search term
  const sanitizedTerm = sanitizeSQLInput(searchTerm);
  
  // Validate the sanitized term
  const validation = validateSQLInput(sanitizedTerm);
  if (!validation.isValid) {
    debug.log('SQL injection attempt detected in search query:', validation.threats);
    throw new Error('Invalid search query');
  }

  // Build safe search filter
  return {
    contains: sanitizedTerm,
    mode: 'insensitive',
  };
}

/**
 * Secure pagination parameters
 */
export function securePaginationParams(
  page?: string | number,
  limit?: string | number
): { skip: number; take: number } {
  // Convert and validate page
  let pageNum = 1;
  if (typeof page === 'string') {
    const parsed = parseInt(page, 10);
    if (!isNaN(parsed) && parsed > 0) {
      pageNum = parsed;
    }
  } else if (typeof page === 'number' && page > 0) {
    pageNum = page;
  }

  // Convert and validate limit
  let limitNum = 10;
  if (typeof limit === 'string') {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      limitNum = parsed;
    }
  } else if (typeof limit === 'number' && limit > 0 && limit <= 100) {
    limitNum = limit;
  }

  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  };
}

/**
 * Secure order by clause builder
 */
export function buildSecureOrderBy(
  sortBy?: string,
  sortOrder?: string
): Record<string, 'asc' | 'desc'> | undefined {
  // Whitelist of allowed sort fields
  const allowedSortFields = [
    'id', 'createdAt', 'updatedAt', 'title', 'name', 'username',
    'displayName', 'email', 'startDate', 'endDate', 'likes', 'views'
  ];

  // Validate sort field
  if (!sortBy || !allowedSortFields.includes(sortBy)) {
    return undefined;
  }

  // Validate sort order
  const order = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';

  return { [sortBy]: order };
}

/**
 * Secure ID validation for database queries
 */
export function validateDatabaseId(id: string): boolean {
  // Check if it's a valid UUID or CUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const cuidRegex = /^c[a-z0-9]{24}$/i;
  
  return uuidRegex.test(id) || cuidRegex.test(id);
}

/**
 * Secure filter builder for complex queries
 */
export function buildSecureFilter(
  filters: Record<string, any>,
  allowedFields: string[]
): Record<string, any> {
  const secureFilter: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    // Only allow whitelisted fields
    if (!allowedFields.includes(key)) {
      return;
    }

    // Sanitize string values
    if (typeof value === 'string') {
      const sanitized = sanitizeSQLInput(value);
      const validation = validateSQLInput(sanitized);
      
      if (validation.isValid) {
        secureFilter[key] = sanitized;
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      secureFilter[key] = value;
    } else if (Array.isArray(value)) {
      // Handle array values (for IN queries)
      const sanitizedArray = value
        .filter(item => typeof item === 'string' || typeof item === 'number')
        .map(item => {
          if (typeof item === 'string') {
            const sanitized = sanitizeSQLInput(item);
            const validation = validateSQLInput(sanitized);
            return validation.isValid ? sanitized : null;
          }
          return item;
        })
        .filter(item => item !== null);
      
      if (sanitizedArray.length > 0) {
        secureFilter[key] = { in: sanitizedArray };
      }
    }
  });

  return secureFilter;
}

/**
 * Log potential SQL injection attempts
 */
export function logSQLInjectionAttempt(
  input: string,
  threats: string[],
  context: string
): void {
  debug.log(`SQL injection attempt detected in ${context}:`, {
    input: input.substring(0, 100), // Log first 100 chars only
    threats,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Secure raw query wrapper (use with extreme caution)
 */
export function secureRawQuery(
  query: string,
  params: any[] = []
): { query: string; params: any[] } {
  // Validate that the query doesn't contain dangerous patterns
  const validation = validateSQLInput(query);
  if (!validation.isValid) {
    logSQLInjectionAttempt(query, validation.threats, 'raw query');
    throw new Error('Dangerous SQL query detected');
  }

  // Ensure parameters are properly escaped
  const sanitizedParams = params.map(param => {
    if (typeof param === 'string') {
      return sanitizeSQLInput(param);
    }
    return param;
  });

  return {
    query,
    params: sanitizedParams,
  };
}

/**
 * Validate and sanitize user input for database operations
 */
export function sanitizeUserInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeSQLInput(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeUserInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, any> = {};
    Object.entries(input).forEach(([key, value]) => {
      sanitized[key] = sanitizeUserInput(value);
    });
    return sanitized;
  }
  
  return input;
}
