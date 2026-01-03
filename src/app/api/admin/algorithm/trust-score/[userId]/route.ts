/**
 * Admin Trust Score Management API
 * Allows admins to view and manage creator trust scores
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateRequest } from "@/auth";
import { updateCreatorTrustScore, getCreatorTrustScore } from "@/lib/algorithm/trust-score";
import debug from "@/lib/debug";

/**
 * GET /api/admin/algorithm/trust-score/[userId]
 * Get detailed trust score for a specific creator
 */
export async function GET(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    // Verify admin access
    const { user } = await validateRequest();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trustScore = await getCreatorTrustScore(userId);
    
    if (!trustScore) {
      return Response.json({ error: "Trust score not found" }, { status: 404 });
    }

    // Get additional context
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
    });

    // Get recent post metrics
    const recentMetrics = await prisma.postMetrics.findMany({
      where: { post: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    // Get recent reports
    const recentReports = await prisma.post_reports.findMany({
      where: { posts: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reason: true,
        createdAt: true,
      },
    });

    return Response.json({
      creator,
      trustScore: {
        ...trustScore,
        trustScore: trustScore.trustScore.toFixed(4),
        originalityScore: trustScore.originalityScore.toFixed(4),
        engagementQuality: trustScore.engagementQuality.toFixed(4),
        spamSignals: trustScore.spamSignals.toFixed(4),
        reportWeight: trustScore.reportWeight.toFixed(4),
        contentQuality: trustScore.contentQuality.toFixed(4),
      },
      recentMetrics: recentMetrics.map(m => ({
        postId: m.postId,
        content: m.post.content.substring(0, 50),
        viralScore: m.viralScore.toFixed(3),
        phase: m.distributionPhase,
        completionRate: (m.completionRate * 100).toFixed(1) + '%',
        createdAt: m.post.createdAt,
      })),
      recentReports,
    });
  } catch (error) {
    debug.error('[Admin] Trust score get error:', error);
    return Response.json(
      { error: "Failed to get trust score" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/algorithm/trust-score/[userId]
 * Recalculate trust score for a specific creator
 */
export async function POST(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    // Verify admin access
    const { user } = await validateRequest();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Recalculate trust score
    await updateCreatorTrustScore(userId);

    // Get updated score
    const trustScore = await getCreatorTrustScore(userId);

    debug.log(`[Admin] Recalculated trust score for user ${userId}`);
    return Response.json({
      success: true,
      trustScore,
    });
  } catch (error) {
    debug.error('[Admin] Trust score recalculation error:', error);
    return Response.json(
      { error: "Failed to recalculate trust score" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/algorithm/trust-score/[userId]
 * Manually adjust trust score or shadow ban status
 */
export async function PATCH(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    // Verify admin access
    const { user } = await validateRequest();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, reason } = body;

    if (action === 'lift_ban') {
      // Manually lift shadow ban
      await prisma.creatorTrustScore.update({
        where: { userId },
        data: {
          isShadowBanned: false,
          shadowBanReason: null,
          shadowBanExpiresAt: null,
          trustScore: 0.5, // Reset to neutral
        },
      });
      debug.log(`[Admin] Lifted shadow ban for user ${userId}`);
    } else if (action === 'apply_ban') {
      // Manually apply shadow ban
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await prisma.creatorTrustScore.update({
        where: { userId },
        data: {
          isShadowBanned: true,
          shadowBanReason: reason || 'Manually applied by admin',
          shadowBanExpiresAt: expiresAt,
          trustScore: 0.1,
        },
      });
      debug.log(`[Admin] Applied shadow ban for user ${userId}`);
    } else if (action === 'reset') {
      // Reset trust score to default
      await prisma.creatorTrustScore.update({
        where: { userId },
        data: {
          originalityScore: 1.0,
          engagementQuality: 1.0,
          spamSignals: 0.0,
          reportWeight: 0.0,
          contentQuality: 1.0,
          trustScore: 1.0,
          isShadowBanned: false,
          shadowBanReason: null,
          shadowBanExpiresAt: null,
        },
      });
      debug.log(`[Admin] Reset trust score for user ${userId}`);
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    const trustScore = await getCreatorTrustScore(userId);
    return Response.json({ success: true, trustScore });
  } catch (error) {
    debug.error('[Admin] Trust score update error:', error);
    return Response.json(
      { error: "Failed to update trust score" },
      { status: 500 }
    );
  }
}
