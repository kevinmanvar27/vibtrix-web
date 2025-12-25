import { validateRequest } from "@/auth";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { z } from "zod";
import { generateIdFromEntropySize } from "lucia";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // Try JWT authentication first (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }

  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

// Validation schema for report request
const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "HARASSMENT",
    "HATE_SPEECH",
    "VIOLENCE",
    "NUDITY",
    "FALSE_INFORMATION",
    "INTELLECTUAL_PROPERTY",
    "OTHER"
  ]),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/posts/[postId]/report
 * Report a post for violating community guidelines
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Request body:
 * - reason: string - The reason for reporting (required)
 *   Valid values: SPAM, HARASSMENT, HATE_SPEECH, VIOLENCE, NUDITY, 
 *                 FALSE_INFORMATION, INTELLECTUAL_PROPERTY, OTHER
 * - description: string - Additional details (optional, max 1000 chars)
 * 
 * Returns: { message: string, reportId: string }
 */
export async function POST(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Prevent users from reporting their own posts
    if (post.userId === user.id) {
      return Response.json(
        { error: "You cannot report your own post" },
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

    // Check if user has already reported this post
    const existingReport = await prisma.post_reports.findUnique({
      where: {
        postId_reporterId: {
          postId,
          reporterId: user.id,
        },
      },
    });

    if (existingReport) {
      return Response.json(
        { error: "You have already reported this post" },
        { status: 409 }
      );
    }

    // Create the report
    const report = await prisma.post_reports.create({
      data: {
        id: generateIdFromEntropySize(10),
        postId,
        reporterId: user.id,
        reason,
        description: description || null,
        updatedAt: new Date(),
      },
    });

    debug.log(`POST /api/posts/${postId}/report - User ${user.id} reported post for: ${reason}`);

    return Response.json(
      { 
        message: "Report submitted successfully",
        reportId: report.id 
      },
      { status: 201 }
    );
  } catch (error) {
    debug.error("Error reporting post:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/posts/[postId]/report
 * Check if the current user has reported this post
 * Supports both JWT (mobile) and session (web) authentication
 * 
 * Returns: { hasReported: boolean, report?: object }
 */
export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has reported this post
    const report = await prisma.post_reports.findUnique({
      where: {
        postId_reporterId: {
          postId,
          reporterId: user.id,
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
    debug.error("Error checking report status:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
