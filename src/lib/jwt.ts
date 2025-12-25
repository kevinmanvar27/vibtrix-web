/**
 * Secure JWT utility functions for token-based authentication
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "./prisma";
import debug from "./debug";
import { generateSecureToken, SECURITY_CONFIG } from "./security";

// Validate JWT secret exists and is strong enough
const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING || JWT_SECRET_STRING.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = SECURITY_CONFIG.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = SECURITY_CONFIG.REFRESH_TOKEN_EXPIRY;

// Token types
export type TokenType = "access" | "refresh";

// Token payload interface
export interface TokenPayload {
  sub: string; // User ID
  jti: string; // Token ID (for revocation)
  type: TokenType; // Token type
  role: string; // User role
  iat: number; // Issued at
  exp: number; // Expires at
  aud: string; // Audience
  iss: string; // Issuer
}

/**
 * Generate a secure JWT token
 * @param userId User ID to include in the token
 * @param type Token type (access or refresh)
 * @param role User role
 * @returns JWT token string
 */
export async function generateToken(
  userId: string,
  type: TokenType,
  role: string
): Promise<string> {
  try {
    // Generate a cryptographically secure token ID
    const tokenId = generateSecureToken(16);

    // Set expiration time based on token type
    const expiresIn = type === "access" ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
    const now = Math.floor(Date.now() / 1000);

    // Create and sign the JWT with enhanced security
    const token = await new SignJWT({
      type,
      role,
      iat: now,
      exp: now + expiresIn,
    })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT"
      })
      .setSubject(userId)
      .setJti(tokenId)
      .setIssuedAt(now)
      .setExpirationTime(now + expiresIn)
      .setAudience("vibtrix-app")
      .setIssuer("vibtrix-api")
      .sign(JWT_SECRET);

    // For refresh tokens, store in database for revocation capability
    if (type === "refresh") {
      await prisma.refreshToken.create({
        data: {
          id: tokenId,
          userId,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          isRevoked: false,
        },
      });
    }

    return token;
  } catch (error) {
    debug.error("Error generating JWT token:", error);
    throw new Error("Failed to generate authentication token");
  }
}

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @param expectedType Expected token type
 * @returns Token payload if valid
 */
export async function verifyToken(
  token: string,
  expectedType: TokenType
): Promise<TokenPayload> {
  try {
    // Verify the token signature and expiration
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Check if token type matches expected type
    if (payload.type !== expectedType) {
      throw new Error(`Invalid token type: expected ${expectedType}`);
    }

    // For refresh tokens, check if it has been revoked
    if (expectedType === "refresh" && payload.jti) {
      const storedToken = await prisma.refreshToken.findUnique({
        where: { id: payload.jti as string },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new Error("Refresh token has been revoked");
      }
    }

    return {
      sub: payload.sub as string,
      jti: payload.jti as string,
      type: payload.type as TokenType,
      role: payload.role as string,
    };
  } catch (error) {
    debug.error("Error verifying JWT token:", error);
    throw new Error("Invalid or expired token");
  }
}

/**
 * Revoke a refresh token
 * @param tokenId Token ID to revoke
 */
export async function revokeToken(tokenId: string): Promise<void> {
  try {
    await prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });
  } catch (error) {
    debug.error("Error revoking token:", error);
    throw new Error("Failed to revoke token");
  }
}

/**
 * Generate both access and refresh tokens for a user
 * @param userId User ID
 * @param role User role
 * @returns Object containing both tokens
 */
export async function generateAuthTokens(userId: string, role: string) {
  const accessToken = await generateToken(userId, "access", role);
  const refreshToken = await generateToken(userId, "refresh", role);

  return {
    accessToken,
    refreshToken,
  };
}
