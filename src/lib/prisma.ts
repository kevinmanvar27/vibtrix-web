import { PrismaClient } from "@prisma/client";

import debug from "@/lib/debug";

// This prevents Prisma Client from being bundled for the browser
// by checking if we're in a browser environment
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Maximum number of connection retries - configurable via environment variable
const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '10', 10);
// Timeout for database connection in milliseconds - configurable via environment variable
const CONNECTION_TIMEOUT = parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10);
// Delay between retries in milliseconds (exponential backoff with shorter initial delay)
const getRetryDelay = (attempt: number) => Math.min(500 * Math.pow(1.5, attempt), 10000);

const prismaClientSingleton = () => {
  // Only create a new PrismaClient if we're in a Node.js environment
  if (typeof window === 'undefined') {
    // In production, disable all logs except critical errors
    if (process.env.NODE_ENV === 'production') {
      return new PrismaClient({
        log: [], // Disable all logs in production
        errorFormat: 'minimal',
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    } else {
      // In development, disable query logging but keep error logging
      return new PrismaClient({
        log: [{ emit: 'event', level: 'error' }], // Only log errors, not queries
        errorFormat: 'pretty',
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    }
  }

  // Return a mock client for browser environments
  return {} as PrismaClient;
};

// Initialize Prisma Client with error handling
let prisma: PrismaClient;

// Function to test database connection with retry logic
async function testDatabaseConnection(client: PrismaClient, retryAttempt = 0): Promise<boolean> {
  try {
    // Database connection attempt in progress

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database connection timeout after ${CONNECTION_TIMEOUT / 1000} seconds`));
      }, CONNECTION_TIMEOUT);
    });

    // Try to connect with timeout
    await Promise.race([client.$connect(), timeoutPromise]);

    // Verify the connection with a simple query
    const result = await client.$queryRaw`SELECT 1 as connection_test`;

    // Connection established successfully

    return true;
  } catch (error) {
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('timeout')) {
      debug.error(`Database connection timeout on attempt ${retryAttempt + 1}/${MAX_RETRIES}`);
    } else if (errorMessage.includes('ECONNREFUSED')) {
      debug.error(`Database connection refused on attempt ${retryAttempt + 1}/${MAX_RETRIES}. Check if database is running.`);
    } else if (errorMessage.includes('authentication')) {
      debug.error(`Database authentication failed on attempt ${retryAttempt + 1}/${MAX_RETRIES}. Check credentials.`);
    } else {
      debug.error(`Database connection attempt ${retryAttempt + 1}/${MAX_RETRIES} failed:`, error);
    }

    // If we haven't reached max retries, try again
    if (retryAttempt < MAX_RETRIES) {
      const delay = getRetryDelay(retryAttempt);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Recursive retry
      return testDatabaseConnection(client, retryAttempt + 1);
    }

    debug.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);

    // Log database connection details for debugging
    debug.error(`Database connection details from environment variables:
      URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'not set'}
    `);

    return false;
  }
}

// Only initialize Prisma in a server environment
if (typeof window === 'undefined') {
  try {
    // Check if we have environment variables for database connection
    if (!process.env.DATABASE_URL) {
      debug.error('DATABASE_URL environment variable is not set');
      throw new Error('Database connection URL is not configured');
    }

    // Use existing connection or create a new one
    prisma = globalForPrisma.prisma ?? prismaClientSingleton();

    // Note: Prisma Client doesn't support $on('error') event listener
    // Errors are thrown directly and should be caught in application code

    // Test the connection with retry logic
    testDatabaseConnection(prisma)
      .then(success => {
        if (!success) {
          debug.warn('Application starting with unreliable database connection - some features may not work correctly');
          // Attempt to reconnect in the background
          setTimeout(() => {
            testDatabaseConnection(prisma)
              .then(reconnected => {
                if (!reconnected) {
                  debug.error('Background database reconnection failed');
                }
              })
              .catch(error => {
                debug.error('Error during background database reconnection:', error);
              });
          }, 5000); // Wait 5 seconds before trying again
        }
      })
      .catch(error => {
        debug.error('Unexpected error during database connection testing:', error);
      });
  } catch (error) {
    debug.error('Error initializing Prisma client:', error);
    // Create a fallback client that will throw clear errors
    prisma = prismaClientSingleton();
    debug.warn('Using fallback Prisma client - database operations may fail');
  }

  // Save the client in the global object
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
} else {
  // In browser environments, create a mock client
  debug.warn('Attempted to use Prisma Client in the browser. Using mock client instead.');
  prisma = {} as PrismaClient;
}

export default prisma;
