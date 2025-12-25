"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { trackLoginActivity } from "@/lib/track-login-activity";
import { verify } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// Import server-side validation
import { z } from "zod";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// Define validation schema directly in the server action to avoid client/server conflicts
const loginSchema = z.object({
  username: z.string().trim().min(1, "Required"),
  password: z.string().trim().min(1, "Required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Create a function to get request data for tracking
function createNextRequest(): NextRequest {
  // Create a minimal NextRequest object with the headers we need
  const headersList = headers();
  const url = new URL(headersList.get('referer') || 'http://localhost');

  return new NextRequest(url, {
    headers: headersList,
  });
}

export async function login(
  credentials: LoginValues,
): Promise<{ error: string }> {
  try {
    const { username, password } = loginSchema.parse(credentials);
    const request = createNextRequest();

    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      // Track failed login attempt if user exists but password is incorrect
      if (existingUser) {
        await trackLoginActivity(existingUser.id, request, 'FAILED');
      }
      return {
        error: "Incorrect username or password",
      };
    }

    // Check if the user has the USER role
    // Only users with the USER role are allowed to access the frontend
    if (existingUser.role !== "USER") {
      // Track failed login attempt due to role restriction
      await trackLoginActivity(existingUser.id, request, 'FAILED');
      return {
        error: "Access denied. Your account does not have permission to log in.",
      };
    }

    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      // Track failed login attempt
      await trackLoginActivity(existingUser.id, request, 'FAILED');
      return {
        error: "Incorrect username or password",
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Track successful login
    await trackLoginActivity(existingUser.id, request, 'SUCCESS');

    // Update user's last active time
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE"
      }
    });

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    debug.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
