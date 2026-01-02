/**
 * User Report API endpoint
 * POST /api/users/[userId]/report - Report a user
 * GET /api/users/[userId]/report - Check if current user has reported this user
 */
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { z } from "zod";
import { generateIdFromEntropySize } from "lucia";
import { getAuthenticatedUser } from "@/lib/api-auth";

// Validation schema for report request
const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "HATE_SPEECH",
    "IMPERSONATION",
    "INAPPROPRIATE_CONTENT",
    "SCAM",
    "UNDERAGE",
    "OTHER"
  ]),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/users/[userId]/report
 * Report a user for violating community guidelines
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request body:
 * - reason: string - The reason for reporting (required)
 *   Valid values: SPAM, HARASSMENT, HATE_SPEECH, IMPERSONATION, 
 *                 INAPPROPRIATE_CONTENT, SCAM, UNDERAGE, OTHER
 * - description: string - Additional details (optional, max 1000 chars)
 * 
 * Returns: { message: string, reportId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent users from reporting themselves
    if (userId === currentUser.id) {
      return Response.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      );
    }

    // Check if the user to report exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const validationResult = reportSchema.safeParse(body);
    if (!validationResult.success) {
      return Response.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { reason, description } = validationResult.data;

    // Check if user has already reported this user
    const existingReport = await prisma.user_reports.findUnique({
      where: {
        userId_reporterId: {
          userId,
          reporterId: currentUser.id,
        },
      },
    });

    if (existingReport) {
      return Response.json(
        { error: "You have already reported this user" },
        { status: 409 }
      );
    }

    // Create the report
    const report = await prisma.user_reports.create({
      data: {
        id: generateIdFromEntropySize(10),
        userId,
        reporterId: currentUser.id,
        reason,
        description: description || null,
        updatedAt: new Date(),
      },
    });

    debug.log(`POST /api/users/${userId}/report - User ${currentUser.id} reported user for: ${reason}`);

    return Response.json(
      { 
        message: "Report submitted successfully",
        reportId: report.id 
      },
      { status: 201 }
    );
  } catch (error) {
    debug.error("Error reporting user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/users/[userId]/report
 * Check if the current user has reported this user
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Returns: { hasReported: boolean, report?: object }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has reported this user
    const report = await prisma.user_reports.findUnique({
      where: {
        userId_reporterId: {
          userId,
          reporterId: currentUser.id,
        },
      },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    return Response.json({
      hasReported: !!report,
      report: report || null,
    });
  } catch (error) {
    debug.error("Error checking user report status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
