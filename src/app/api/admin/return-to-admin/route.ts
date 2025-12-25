import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

import debug from "@/lib/debug";

export async function POST() {
  try {
    debug.log("return-to-admin API - Starting request");

    // Get the admin user ID from the cookie
    const adminUserId = cookies().get("admin_user_id")?.value;
    debug.log(`return-to-admin API - Admin user ID from cookie: ${adminUserId || 'Not found'}`);

    if (!adminUserId) {
      debug.log("return-to-admin API - No admin_user_id cookie found");
      return Response.json({ error: "No admin session found" }, { status: 400 });
    }

    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser) {
      return Response.json({ error: "Admin user not found" }, { status: 404 });
    }

    // Verify that the user is actually an admin
    const isAdmin =
      adminUser.role === "ADMIN" ||
      adminUser.role === "MANAGER" ||
      adminUser.role === "SUPER_ADMIN";

    if (!isAdmin) {
      return Response.json({ error: "Invalid admin user" }, { status: 401 });
    }

    // Delete the admin_user_id cookie
    cookies().delete("admin_user_id");

    // Create a new session for the admin user
    const session = await lucia.createSession(adminUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return Response.json({
      success: true,
      message: `You are now logged back in as admin ${adminUser.username}`,
      redirectTo: "/admin/dashboard"
    });
  } catch (error) {
    debug.error("Error in return-to-admin:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
