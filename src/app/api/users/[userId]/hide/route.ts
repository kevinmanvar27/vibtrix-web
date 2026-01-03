/**
 * Hide Creator API
 * Allows users to hide a creator's content from their feed
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { hideCreator } from "@/lib/algorithm/ranking-engine";
import debug from "@/lib/debug";

/**
 * POST /api/users/[userId]/hide
 * Hide a creator's content from the feed
 */
export async function POST(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } }
) {
  try {
    debug.log(`POST /api/users/${userId}/hide - Hiding creator`);
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Can't hide yourself
    if (user.id === userId) {
      return Response.json({ error: "Cannot hide yourself" }, { status: 400 });
    }

    await hideCreator(user.id, userId);

    debug.log(`POST /api/users/${userId}/hide - Successfully hidden`);
    
    return Response.json({ success: true });
  } catch (error) {
    debug.error(`POST /api/users/${userId}/hide - Error:`, error);
    return Response.json(
      { error: "Failed to hide creator" },
      { status: 500 }
    );
  }
}
