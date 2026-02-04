/**
 * Comment Report API endpoint
 * POST /api/comments/[commentId]/report - Report a comment
 * GET /api/comments/[commentId]/report - Check if current user has reported this comment
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
    "VIOLENCE",
    "NUDITY",
    "FALSE_INFORMATION",
    "OTHER"
  ]),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/comments/[commentId]/report
 * Report a comment for violating community guidelines
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request body:
 * - reason: string - The reason for reporting (required)
 *   Valid values: SPAM, HARASSMENT, HATE_SPEECH, VIOLENCE, NUDITY, 
 *                 FALSE_INFORMATION, OTHER
 * - description: string - Additional details (optional, max 1000 chars)
 * 
 * Returns: { message: string, reportId: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!comment) {
      return Response.json({ error: "Comment not found" }, { status: 404 });
    }

    // Prevent users from reporting their own comments
    if (comment.userId === currentUser.id) {
      return Response.json(
        { error: "You cannot report your own comment" },
        { status: 400 }
      );
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

    // Check if user has already reported this comment
    const existingReport = await prisma.comment_reports.findUnique({
      where: {
        commentId_reporterId: {
          commentId,
          reporterId: currentUser.id,
        },
      },
    });

    if (existingReport) {
      return Response.json(
        { error: "You have already reported this comment" },
        { status: 409 }
      );
    }

    // Create the report
    const report = await prisma.comment_reports.create({
      data: {
        id: generateIdFromEntropySize(10),
        commentId,
        reporterId: currentUser.id,
        reason,
        description: description || null,
        updatedAt: new Date(),
      },
    });

    debug.log(`POST /api/comments/${commentId}/report - User ${currentUser.id} reported comment for: ${reason}`);

    return Response.json(
      { 
        message: "Report submitted successfully",
        reportId: report.id 
      },
      { status: 201 }
    );
  } catch (error) {
    debug.error("Error reporting comment:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/comments/[commentId]/report
 * Check if the current user has reported this comment
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Returns: { hasReported: boolean, report?: object }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has reported this comment
    const report = await prisma.comment_reports.findUnique({
      where: {
        commentId_reporterId: {
          commentId,
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
    debug.error("Error checking comment report status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
