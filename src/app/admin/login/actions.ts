"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { trackLoginActivity } from "@/lib/track-login-activity";
import { verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { z } from "zod";

import debug from "@/lib/debug";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

// Create a function to get request data for tracking
function createNextRequest(): NextRequest {
  // Create a minimal NextRequest object with the headers we need
  const headersList = headers();
  const url = new URL(headersList.get('referer') || 'http://localhost');

  return new NextRequest(url, {
    headers: headersList,
  });
}

export async function adminLogin(credentials: {
  usernameOrEmail: string;
  password: string;
}): Promise<{ error?: string; success?: boolean }> {
  try {
    debug.log("Admin login action - Starting login process");
    const { usernameOrEmail, password } = loginSchema.parse(credentials);
    debug.log(`Admin login action - Attempting login for: ${usernameOrEmail}`);
    const request = createNextRequest();

    // Find user by username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            username: {
              equals: usernameOrEmail,
              mode: "insensitive",
            },
          },
          {
            email: {
              equals: usernameOrEmail,
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      debug.log("Admin login action - User not found or no password hash");
      return {
        error: "Invalid credentials",
      };
    }

    debug.log(`Admin login action - User found: ${existingUser.username}, Role: ${existingUser.role}`);

    // Check if user has appropriate role for admin access
    const hasAdminAccess =
      existingUser.role === "ADMIN" ||
      existingUser.role === "MANAGER" ||
      existingUser.role === "SUPER_ADMIN";

    if (!hasAdminAccess) {
      debug.log(`Admin login action - User ${existingUser.username} does not have admin privileges`);
      // Track failed login attempt due to insufficient privileges
      await trackLoginActivity(existingUser.id, request, 'FAILED');
      return {
        error: "You do not have admin privileges",
      };
    }

    // Verify password
    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      debug.log(`Admin login action - Invalid password for user ${existingUser.username}`);
      // Track failed login attempt due to invalid password
      await trackLoginActivity(existingUser.id, request, 'FAILED');
      return {
        error: "Invalid credentials",
      };
    }

    debug.log(`Admin login action - Password verified for user ${existingUser.username}`);

    // Create session
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Update user's last active time
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE"
      }
    });

    // Track successful admin login
    await trackLoginActivity(existingUser.id, request, 'SUCCESS');

    debug.log(`Admin login action - Login successful for user ${existingUser.username}`);
    return { success: true };
  } catch (error) {
    debug.error("Admin login action - Error:", error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
