import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Google } from "arctic";
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      email: databaseUserAttributes.email,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
      gender: databaseUserAttributes.gender,
      whatsappNumber: databaseUserAttributes.whatsappNumber,
      dateOfBirth: databaseUserAttributes.dateOfBirth,
      isAdmin: databaseUserAttributes.isAdmin,
      role: databaseUserAttributes.role,
      isActive: databaseUserAttributes.isActive,
      onlineStatus: databaseUserAttributes.onlineStatus,
      lastActiveAt: databaseUserAttributes.lastActiveAt,
      showOnlineStatus: databaseUserAttributes.showOnlineStatus,
      isProfilePublic: databaseUserAttributes.isProfilePublic,
      showWhatsappNumber: databaseUserAttributes.showWhatsappNumber,
      showFullDob: databaseUserAttributes.showFullDob,
      showDob: databaseUserAttributes.showDob,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  gender: string | null;
  whatsappNumber: string | null;
  dateOfBirth: string | null;
  upiId: string | null;
  socialLinks: any | null;
  isAdmin: boolean;
  role: "USER" | "ADMIN" | "MANAGER" | "SUPER_ADMIN";
  isActive: boolean;
  onlineStatus: "ONLINE" | "IDLE" | "OFFLINE";
  lastActiveAt: Date | null;
  showOnlineStatus: boolean;
  isProfilePublic: boolean;
  showWhatsappNumber: boolean;
  showFullDob: boolean;
  showDob: boolean;
  showUpiId: boolean;
}

// Use the exact redirect URI that's configured in Google Cloud Console
// This must match exactly what's in the Google Cloud Console to avoid redirect_uri_mismatch errors
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/callback/google`, // Must match Google Cloud Console configuration
);

import debug from "./lib/debug";

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    debug.log("validateRequest - Starting validation");
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);
    const sessionId = sessionCookie?.value ?? null;

    if (!sessionId) {
      debug.log("validateRequest - No session ID, returning null");
      return {
        user: null,
        session: null,
      };
    }

    debug.log("validateRequest - Validating session with Lucia");
    const result = await lucia.validateSession(sessionId);
    debug.log(`validateRequest - Session validation result: ${result.user ? "User found" : "No user"}`);

    try {
      if (result.session && result.session.fresh) {
        debug.log("validateRequest - Session is fresh, creating new session cookie");
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
        debug.log("validateRequest - New session cookie set");
      }
      if (!result.session) {
        debug.log("validateRequest - No valid session, creating blank session cookie");
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
        debug.log("validateRequest - Blank session cookie set");
      }
    } catch (error) {
      debug.error("validateRequest - Error setting cookies:", error);
    }

    return result;
  },
);
