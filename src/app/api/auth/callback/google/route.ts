import { google, lucia } from "@/auth";
import apiClient from "@/lib/api-client";
import prisma from "@/lib/prisma";
import { trackLoginActivity } from "@/lib/track-login-activity";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  debug.log('Google OAuth callback - Starting callback processing');

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  debug.log('Google OAuth callback - Request parameters:', {
    hasCode: !!code,
    hasState: !!state,
    hasError: !!error
  });

  // Handle error parameter from Google OAuth
  if (error) {
    debug.error('Google OAuth error:', error);
    const errorDescription = req.nextUrl.searchParams.get("error_description");
    return new Response(JSON.stringify({ error, details: errorDescription }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    // Use native fetch instead of kyInstance to avoid potential issues
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
    }

    const googleUser = await userInfoResponse.json() as { id: string; name: string; email?: string };

    const existingUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    if (existingUser) {
      // Check if the user has the USER role
      // Only users with the USER role are allowed to access the frontend
      if (existingUser.role !== "USER") {
        debug.log(`Google OAuth callback - User ${existingUser.username} has role ${existingUser.role}, access denied`);

        // Track failed login attempt due to role restriction
        try {
          await trackLoginActivity(existingUser.id, req, 'FAILED');
        } catch (trackError) {
          debug.error('Google OAuth callback - Error tracking login activity:', trackError);
        }

        // Redirect to access denied page
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/access-denied",
          },
        });
      }

      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      debug.log('Google OAuth callback - Setting session cookie:', {
        name: sessionCookie.name,
        attributes: sessionCookie.attributes
      });

      // Ensure the cookie is set with the correct attributes
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        {
          ...sessionCookie.attributes,
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        },
      );
      // Track successful login
      debug.log('Google OAuth callback - About to track login activity for existing user:', existingUser.id);
      try {
        await trackLoginActivity(existingUser.id, req, 'SUCCESS');
        debug.log('Google OAuth callback - Login activity tracked successfully for existing user');
      } catch (trackError) {
        debug.error('Google OAuth callback - Error tracking login activity:', trackError);
      }

      // Update user's last active time
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          lastActiveAt: new Date(),
          onlineStatus: "ONLINE"
        }
      });

      // Get the stored origin from the cookie
      const storedOrigin = cookies().get("oauth_origin")?.value;

      // Determine the redirect location
      const redirectLocation = storedOrigin || "/";

      // Clear the oauth_origin cookie
      cookies().set("oauth_origin", "", {
        path: "/",
        expires: new Date(0),
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectLocation,
        },
      });
    }

    const userId = generateIdFromEntropySize(10);

    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: googleUser.name,
        googleId: googleUser.id,
        email: googleUser.email,
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE",
        isActive: true,
        showOnlineStatus: true,
        isProfilePublic: true,
        role: "USER", // Explicitly set role to USER for new users
      },
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    debug.log('Google OAuth callback - Setting session cookie for new user:', {
      name: sessionCookie.name,
      attributes: sessionCookie.attributes
    });

    // Ensure the cookie is set with the correct attributes
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      {
        ...sessionCookie.attributes,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    );

    // Track successful signup/login
    debug.log('Google OAuth callback - About to track login activity for new user:', userId);
    try {
      await trackLoginActivity(userId, req, 'SUCCESS');
      debug.log('Google OAuth callback - Login activity tracked successfully for new user');
    } catch (trackError) {
      debug.error('Google OAuth callback - Error tracking login activity for new user:', trackError);
    }

    // Update user's last active time
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        onlineStatus: "ONLINE"
      }
    });

    // Get the stored origin from the cookie
    const storedOrigin = cookies().get("oauth_origin")?.value;

    // Determine the redirect location
    const redirectLocation = storedOrigin || "/";

    // Clear the oauth_origin cookie
    cookies().set("oauth_origin", "", {
      path: "/",
      expires: new Date(0),
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectLocation,
      },
    });
  } catch (error) {
    debug.error('Google OAuth error:', error);

    if (error instanceof OAuth2RequestError) {
      debug.error('OAuth2RequestError details:', {
        description: error.description,
        request: error.request?.url,
      });
      return new Response(JSON.stringify({ error: 'OAuth authentication failed', details: error.description }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Authentication failed', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
