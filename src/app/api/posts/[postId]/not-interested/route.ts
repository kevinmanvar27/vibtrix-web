/**
 * Not Interested API
 * Allows users to mark posts as "Not Interested" to improve recommendations
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { markNotInterested } from "@/lib/algorithm/ranking-engine";
import debug from "@/lib/debug";

/**
 * POST /api/posts/[postId]/not-interested
 * Mark a post as "Not Interested"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  try {
    debug.log(`POST /api/posts/${postId}/not-interested - Marking post as not interested`);
    
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await markNotInterested(user.id, postId);

    debug.log(`POST /api/posts/${postId}/not-interested - Successfully marked`);
    
    return Response.json({ success: true });
  } catch (error) {
    debug.error(`POST /api/posts/${postId}/not-interested - Error:`, error);
    return Response.json(
      { error: "Failed to mark post as not interested" },
      { status: 500 }
    );
  }
}
