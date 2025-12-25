"use server";

import { validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action to check if a user is authenticated
 * If not, redirects to Google login with the current URL as the return URL
 */
export async function requireAuth(returnUrl?: string) {
  const { user } = await validateRequest();

  if (!user) {
    // Store the return URL in a cookie
    if (returnUrl) {
      cookies().set("oauth_origin", returnUrl, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
      });
    }

    // Redirect to Google login
    redirect(`/login/google${returnUrl ? `?from=${encodeURIComponent(returnUrl)}` : ""}`);
  }

  return { user };
}

/**
 * Server action to check if a user is authenticated
 * Returns the user if authenticated, null otherwise
 * Does not redirect
 */
export async function checkAuth() {
  const { user } = await validateRequest();
  return { user };
}
