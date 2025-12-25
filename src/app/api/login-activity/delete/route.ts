import { validateRequest } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// This is a server-side API endpoint, so it's safe to create a new PrismaClient here
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    debug.log("API: Deleting single login activity");
    
    // Parse the request body to get the activity ID
    const body = await req.json();
    const { activityId } = body;
    
    if (!activityId) {
      debug.log("API: No activity ID provided");
      return Response.json({ error: "Activity ID is required" }, { status: 400 });
    }
    
    // Validate the user is authenticated
    const { user } = await validateRequest();
    
    if (!user) {
      debug.log("API: User not authenticated");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    debug.log(`API: User authenticated, ID: ${user.id}, deleting activity: ${activityId}`);
    
    // First, check if the activity belongs to the user
    const activityCheck = await prisma.$queryRaw`
      SELECT id FROM user_login_activities 
      WHERE id = ${activityId} AND "userId" = ${user.id}
      LIMIT 1
    `;
    
    if (!activityCheck || (Array.isArray(activityCheck) && activityCheck.length === 0)) {
      debug.log("API: Activity not found or doesn't belong to user");
      return Response.json({ 
        error: "Activity not found", 
        details: "The specified login activity does not exist or doesn't belong to you" 
      }, { status: 404 });
    }
    
    // Use a raw SQL query to delete the specific login activity
    const result = await prisma.$executeRaw`
      DELETE FROM user_login_activities
      WHERE id = ${activityId} AND "userId" = ${user.id}
    `;
    
    debug.log("API: SQL query executed, deleted records:", result);
    
    return Response.json({ 
      success: true, 
      message: "Login activity deleted successfully"
    });
    
  } catch (error) {
    debug.error("API: Error deleting login activity:", error);
    
    // Log more details about the error
    if (error instanceof Error) {
      debug.error("API: Error message:", error.message);
      debug.error("API: Error stack:", error.stack);
    }
    
    return Response.json({ 
      error: "Failed to delete login activity",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
