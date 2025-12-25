"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { trackLoginActivity } from "@/lib/track-login-activity";

import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

// Create a function to get request data for tracking
function createNextRequest(): NextRequest {
  // Create a minimal NextRequest object with the headers we need
  const headersList = headers();
  const url = new URL(headersList.get('referer') || 'http://localhost');

  return new NextRequest(url, {
    headers: headersList,
  });
}

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);
    const request = createNextRequest();

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "Username already taken",
      };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return {
        error: "Email already taken",
      };
    }

    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE",
        role: "USER", // Explicitly set role to USER for new users
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Track successful signup/login
    await trackLoginActivity(userId, request, 'SUCCESS');

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    debug.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
