import debug from "@/lib/debug";

/**
 * Handles database errors gracefully in API routes
 * Returns a user-friendly error response while logging the actual error
 */
export function handleDatabaseError(error: unknown, context = "Database operation"): { success: false; error: string; retryAfter?: number | null } {
  // Log the full error for debugging
  debug.error(`Error during ${context}:`, error);

  // Check if it's a Prisma error
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Handle specific database errors
  if (errorMessage.includes("Named pipe")) {
    debug.error("Database connection issue - Named pipes not available. Using TCP/IP connection.");
    return {
      success: false,
      error: "Database temporarily unavailable",
      retryAfter: 5000, // Suggest retry after 5 seconds
    };
  }
  
  if (errorMessage.includes("ECONNREFUSED")) {
    debug.error("Database connection refused - check if MySQL is running");
    return {
      success: false,
      error: "Database connection failed",
      retryAfter: 5000,
    };
  }
  
  if (errorMessage.includes("timeout")) {
    debug.error("Database connection timeout");
    return {
      success: false,
      error: "Database request timed out",
      retryAfter: 10000,
    };
  }
  
  if (errorMessage.includes("authentication")) {
    debug.error("Database authentication failed");
    return {
      success: false,
      error: "Database configuration error",
      retryAfter: null, // Don't retry auth errors
    };
  }
  
  // Generic database error
  return {
    success: false,
    error: "Failed to process database request",
    retryAfter: 5000,
  };
}

/**
 * Wraps an async database operation with error handling
 * @param operation The async database operation to execute
 * @param context Description of the operation for logging
 * @returns The result of the operation or an error object
 */
export async function withDatabaseErrorHandler<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | { success: false; error: string; retryAfter?: number | null }> {
  try {
    return await operation();
  } catch (error) {
    return handleDatabaseError(error, context);
  }
}
