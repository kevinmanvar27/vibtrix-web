import { lucia, validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

import debug from "@/lib/debug";

export async function POST(req: Request) {
  try {
    debug.log("login-as-user API - Starting request");

    // Validate that the requester is an admin
    const { user: adminUser } = await validateRequest();

    debug.log("login-as-user API - User from validateRequest:", adminUser ? {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      isAdmin: adminUser.isAdmin
    } : "Not logged in");

    if (!adminUser) {
      debug.log("login-as-user API - No user found in session");
      return Response.json({ error: "Unauthorized - Not logged in" }, { status: 401 });
    }

    if (!(
      adminUser.role === "ADMIN" ||
      adminUser.role === "MANAGER" ||
      adminUser.role === "SUPER_ADMIN"
    )) {
      debug.log(`login-as-user API - User ${adminUser.username} has insufficient role: ${adminUser.role}`);
      return Response.json({ error: "Unauthorized - Insufficient permissions" }, { status: 401 });
    }

    // Get the target user ID from the request body
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Store the admin's user ID in a separate cookie to allow returning to admin
    cookies().set("admin_user_id", adminUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    // Create a new session for the target user
    const session = await lucia.createSession(targetUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Log the impersonation for audit purposes
    debug.log(`Admin ${adminUser.username} (${adminUser.id}); is now logged in as ${targetUser.username} (${targetUser.id})`);

    return Response.json({
      success: true,
      message: `You are now logged in as ${targetUser.username}`,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
      }
    });
  } catch (error) {
    debug.error("Error in login-as-user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
