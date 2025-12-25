import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import debug from "@/lib/debug";
import { verifyJwtAuth } from "@/lib/jwt-auth";
import { NextRequest } from "next/server";

/**
 * Helper function to get authenticated user from JWT or session
 * Supports both mobile (JWT) and web (session) authentication
 */
async function getAuthenticatedUser(req: NextRequest) {
  // First try JWT authentication (for mobile apps)
  const jwtUser = await verifyJwtAuth(req);
  if (jwtUser) {
    return jwtUser;
  }
  
  // Fall back to session authentication (for web)
  const { user } = await validateRequest();
  return user;
}

// Valid feedback types
const FEEDBACK_TYPES = [
  "BUG_REPORT",
  "FEATURE_REQUEST",
  "GENERAL_FEEDBACK",
  "COMPLAINT",
  "QUESTION",
  "OTHER",
] as const;

type FeedbackType = typeof FEEDBACK_TYPES[number];

interface FeedbackRequest {
  type: FeedbackType;
  message: string;
  screenshotUrl?: string;
}

interface FeedbackResponse {
  id: string;
  type: string;
  message: string;
  screenshotUrl: string | null;
  status: string;
  createdAt: Date;
}

/**
 * POST /api/feedback
 * Submit feedback from the mobile app
 * 
 * Request body:
 * - type: Feedback type (BUG_REPORT, FEATURE_REQUEST, GENERAL_FEEDBACK, COMPLAINT, QUESTION, OTHER)
 * - message: Feedback message (required, min 10 characters)
 * - screenshotUrl: Optional URL to a screenshot
 */
export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as FeedbackRequest;
    const { type, message, screenshotUrl } = body;

    // Validate feedback type
    if (!type || !FEEDBACK_TYPES.includes(type)) {
      return Response.json(
        { 
          error: "Invalid feedback type",
          validTypes: FEEDBACK_TYPES,
        }, 
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      return Response.json(
        { error: "Message must be at least 10 characters long" }, 
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 5000) {
      return Response.json(
        { error: "Message must be less than 5000 characters" }, 
        { status: 400 }
      );
    }

    // Validate screenshot URL if provided
    if (screenshotUrl && typeof screenshotUrl === "string") {
      try {
        new URL(screenshotUrl);
      } catch {
        return Response.json(
          { error: "Invalid screenshot URL" }, 
          { status: 400 }
        );
      }
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        userId: loggedInUser.id,
        type,
        message: trimmedMessage,
        screenshotUrl: screenshotUrl || null,
        status: "PENDING",
      },
    });

    const response: FeedbackResponse = {
      id: feedback.id,
      type: feedback.type,
      message: feedback.message,
      screenshotUrl: feedback.screenshotUrl,
      status: feedback.status,
      createdAt: feedback.createdAt,
    };

    return Response.json(response, { status: 201 });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/feedback
 * Get user's own feedback submissions
 * 
 * Query params:
 * - cursor: Pagination cursor (feedback id)
 * - limit: Number of results (default: 20, max: 50)
 * - status: Filter by status (PENDING, REVIEWED, RESOLVED, CLOSED)
 */
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await getAuthenticatedUser(req);

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const status = url.searchParams.get("status");
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10), 1), 50);

    // Build where clause
    const whereClause: any = {
      userId: loggedInUser.id,
    };

    if (status) {
      whereClause.status = status;
    }

    // Fetch feedback with cursor-based pagination
    const feedbackItems = await prisma.feedback.findMany({
      where: whereClause,
      take: limit + 1, // Fetch one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item
      }),
      orderBy: {
        createdAt: "desc",
      },
    });

    const hasMore = feedbackItems.length > limit;
    const items = hasMore ? feedbackItems.slice(0, limit) : feedbackItems;

    return Response.json({
      feedback: items.map(item => ({
        id: item.id,
        type: item.type,
        message: item.message,
        screenshotUrl: item.screenshotUrl,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : null,
    });
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
