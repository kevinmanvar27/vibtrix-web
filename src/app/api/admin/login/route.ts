import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import debug from "@/lib/debug";

export async function POST(request: NextRequest) {
  try {
    debug.log('API route: /api/admin/login - POST request received');
    
    // Parse form data
    const formData = await request.formData();
    const usernameOrEmail = formData.get("usernameOrEmail") as string;
    const password = formData.get("password") as string;

    debug.log(`API login attempt for: ${usernameOrEmail}`);

    if (!usernameOrEmail || !password) {
      debug.log('Missing username/email or password');
      return NextResponse.redirect(
        new URL("/admin-login?error=Invalid+credentials", request.url)
      );
    }

    // Test database connection
    try {
      debug.log('Testing database connection...');
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      debug.log('Database connection successful');
    } catch (dbError) {
      debug.error('Database connection failed:', dbError);
      return NextResponse.redirect(
        new URL("/admin-login?error=Database+connection+failed", request.url)
      );
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
      return NextResponse.redirect(
        new URL("/admin-login?error=Invalid+credentials", request.url)
      );
    }

    if (!existingUser.passwordHash) {
      debug.log(`User found but has no password hash: ${existingUser.username}`);
      return NextResponse.redirect(
        new URL("/admin-login?error=Invalid+credentials", request.url)
      );
    }

    debug.log(`User found: ${existingUser.username}, isAdmin: ${existingUser.isAdmin}`);

    // Check if user is an admin
    if (!existingUser.isAdmin) {
      debug.log(`User ${existingUser.username} is not an admin`);
      return NextResponse.redirect(
        new URL("/admin-login?error=You+do+not+have+admin+privileges", request.url)
      );
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
      return NextResponse.redirect(
        new URL("/admin-login?error=Error+verifying+credentials", request.url)
      );
    }

    if (!validPassword) {
      debug.log('Password verification failed');
      return NextResponse.redirect(
        new URL("/admin-login?error=Invalid+credentials", request.url)
      );
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

      debug.log('Login successful, redirecting to dashboard');
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } catch (error) {
      debug.error('Error creating session:', error);
      return NextResponse.redirect(
        new URL("/admin-login?error=Error+creating+session", request.url)
      );
    }
  } catch (error) {
    debug.error('API login - Unexpected error:', error);
    
    // Log the error details for debugging
    if (error instanceof Error) {
      debug.error('Error name:', error.name);
      debug.error('Error message:', error.message);
      debug.error('Error stack:', error.stack);
    } else {
      debug.error('Unknown error type:', typeof error);
    }

    // Redirect with a generic error message
    return NextResponse.redirect(
      new URL("/admin-login?error=An+unexpected+error+occurred", request.url)
    );
  }
}
