"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import debug from "@/lib/debug";

// Don't use redirect from next/navigation in server actions
// Instead, return a response object that the client can use to redirect

// Define response type for better type safety
type AdminLoginResponse = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

export async function adminLogin(formData: FormData): Promise<AdminLoginResponse> {
  try {
    // Log the start of the server action
    debug.log('Admin login server action started');

    const usernameOrEmail = formData.get("usernameOrEmail") as string;
    const password = formData.get("password") as string;

    debug.log(`Admin login attempt for: ${usernameOrEmail}`);

    if (!usernameOrEmail || !password) {
      debug.log('Missing username/email or password');
      return {
        success: false,
        error: "Invalid credentials"
      };
    }

    // Test database connection before proceeding
    try {
      debug.log('Testing database connection...');
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      debug.log('Database connection successful');
    } catch (dbError) {
      debug.error('Database connection failed:', dbError);
      return {
        success: false,
        error: "Database connection failed. Please try again later."
      };
    }

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

    if (!existingUser) {
      debug.log(`User not found: ${usernameOrEmail}`);
      return {
        success: false,
        error: "Invalid credentials"
      };
    }

    if (!existingUser.passwordHash) {
      debug.log(`User found but has no password hash: ${existingUser.username}`);
      return {
        success: false,
        error: "Invalid credentials"
      };
    }

    debug.log(`User found: ${existingUser.username} (${existingUser.email});, isAdmin: ${existingUser.isAdmin}, role: ${existingUser.role}`);

    // Check if user is an admin
    if (!existingUser.isAdmin) {
      return {
        success: false,
        error: "You do not have admin privileges"
      };
    }

    // Verify password
    debug.log('Verifying password...');
    let validPassword = false;
    try {
      validPassword = await verify(existingUser.passwordHash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
    } catch (error) {
      debug.error('Error verifying password:', error);
      return {
        success: false,
        error: "Error verifying credentials"
      };
    }

    if (!validPassword) {
      debug.log('Password verification failed');
      return {
        success: false,
        error: "Invalid credentials"
      };
    }

    debug.log('Password verified successfully');

    // Create session
    debug.log('Creating session for user:', existingUser.id);
    try {
      const session = await lucia.createSession(existingUser.id, {});
      debug.log('Session created:', session.id);

      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      debug.log('Session cookie set');

      // Update user's last active time
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastActiveAt: new Date(),
          onlineStatus: "ONLINE"
        }
      });
      debug.log('User online status updated');

      debug.log('Login successful');
      return {
        success: true,
        redirectTo: "/admin/dashboard"
      };
    } catch (error) {
      debug.error('Error creating session:', error);
      return {
        success: false,
        error: "Error creating session"
      };
    }
  } catch (error) {
    debug.error('Admin login - Unexpected error:', error);

    // Log the error details for debugging
    if (error instanceof Error) {
      debug.error('Error name:', error.name);
      debug.error('Error message:', error.message);
      debug.error('Error stack:', error.stack);

      // Handle specific error types
      if (error.name === 'PrismaClientInitializationError') {
        return {
          success: false,
          error: "Database connection failed. Please try again later."
        };
      } else if (error.name === 'PrismaClientKnownRequestError') {
        return {
          success: false,
          error: "Database query failed. Please try again later."
        };
      } else if (error.message.includes('fetch')) {
        return {
          success: false,
          error: "Network error. Please check your connection and try again."
        };
      }
    } else {
      debug.error('Unknown error type:', typeof error);
    }

    // Return a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    return {
      success: false,
      error: "Login failed: " + errorMessage
    };
  }
}
