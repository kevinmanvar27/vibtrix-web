import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  // Get the 'from' parameter from the URL if available
  const url = new URL(request.url);
  const fromParam = url.searchParams.get('from');

  // Use the exact redirect URI that's configured in Google Cloud Console
  // This must match exactly what's in the Google Cloud Console to avoid redirect_uri_mismatch errors
  let redirectURI = "http://localhost:3000/api/auth/callback/google";

  // Store the 'from' parameter in a cookie so we can redirect back to it after authentication
  if (fromParam) {
    cookies().set("oauth_origin", fromParam, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });
  }

  // Create the authorization URL with the correct scopes
  const authUrl = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["profile", "email"],
  });

  cookies().set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookies().set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  return Response.redirect(authUrl);
}
