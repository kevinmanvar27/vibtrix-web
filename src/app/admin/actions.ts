"use server";

import { lucia, validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import debug from "@/lib/debug";

export async function adminLogout() {
  const { session } = await validateRequest();

  // If there's a valid session, invalidate it
  if (session) {
    try {
      await lucia.invalidateSession(session.id);
    } catch (error) {
      debug.error("Error invalidating session:", error);
      // Continue even if there's an error invalidating the session
    }
  }

  // Always clear the session cookie, regardless of whether we had a valid session
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  // No redirect here, the page component will handle it
  return { success: true };
}
