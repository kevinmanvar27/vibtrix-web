import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

/**
 * Health check endpoint to verify the application is running correctly
 * This endpoint checks:
 * 1. API routes are working
 * 2. Database connection is working
 * 3. Basic system information
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check database connection
    let dbStatus = "unknown";
    let dbError = null;
    let dbConnectionTime = 0;
    let dbDetails = {};

    try {
      debug.log("Health check: Testing database connection");
      const dbStartTime = Date.now();

      // Simple query to check database connection
      const result = await prisma.$queryRaw`SELECT 1 as health_check, current_database() as db_name, version() as db_version`;

      const dbEndTime = Date.now();
      dbConnectionTime = dbEndTime - dbStartTime;
      dbStatus = "connected";

      // Extract database details from the result
      if (Array.isArray(result) && result.length > 0) {
        const dbInfo = result[0] as any;
        dbDetails = {
          name: dbInfo.db_name,
          version: dbInfo.db_version?.split(' ')[1] || 'unknown',
          connectionTime: dbConnectionTime + 'ms'
        };
      }

      debug.log(`Health check: Database connection successful (${dbConnectionTime}ms)`);
    } catch (error) {
      dbStatus = "error";
      dbError = error instanceof Error ? error.message : String(error);
      debug.error("Health check: Database connection failed:", error);
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Return health status
    return Response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbStatus,
        error: dbError,
        connectionTime: dbConnectionTime + 'ms',
        ...dbDetails,
        config: {
          url: process.env.POSTGRES_PRISMA_URL ?
            process.env.POSTGRES_PRISMA_URL.replace(/:[^:@]+@/, ':****@') :
            'not set',
          host: process.env.POSTGRES_PRISMA_URL?.split('@')[1]?.split(':')[0] || 'unknown',
          port: process.env.POSTGRES_PRISMA_URL?.split('@')[1]?.split(':')[1]?.split('/')[0] || 'unknown',
        }
      },
      system: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + "MB",
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        },
      },
      performance: {
        responseTime: responseTime + "ms",
      },
    }, { status: 200 });
  } catch (error) {
    debug.error("Health check failed:", error);

    return Response.json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
