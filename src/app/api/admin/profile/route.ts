import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { hash, verify } from "@node-rs/argon2";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET() {
  try {
    const { user } = await validateRequest();
    
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
      }
    });
    
    if (!adminUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    return Response.json({ 
      user: {
        id: adminUser.id,
        username: adminUser.username,
        displayName: adminUser.displayName,
        email: adminUser.email,
        avatarUrl: adminUser.avatarUrl,
      }
    });
  } catch (error) {
    debug.error("Error fetching admin profile:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.username || data.username.length < 3) {
      return Response.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    
    if (!data.displayName || data.displayName.length < 2) {
      return Response.json({ error: "Display name must be at least 2 characters" }, { status: 400 });
    }
    
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    
    // Check if username is already taken by another user
    if (data.username !== user.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: data.username,
            mode: "insensitive",
          },
          id: { not: user.id },
        },
      });
      
      if (existingUser) {
        return Response.json({ error: "Username is already taken" }, { status: 400 });
      }
    }
    
    // Check if email is already taken by another user
    if (data.email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: "insensitive",
          },
          id: { not: user.id },
        },
      });
      
      if (existingUser) {
        return Response.json({ error: "Email is already taken" }, { status: 400 });
      }
    }
    
    // Prepare update data
    const updateData: any = {
      username: data.username,
      displayName: data.displayName,
      email: data.email,
    };
    
    // Handle password change if requested
    if (data.currentPassword && data.newPassword && data.confirmPassword) {
      // Validate password fields
      if (data.newPassword.length < 8) {
        return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      
      if (data.newPassword !== data.confirmPassword) {
        return Response.json({ error: "Passwords do not match" }, { status: 400 });
      }
      
      // Get current user with password hash
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });
      
      if (!currentUser?.passwordHash) {
        return Response.json({ error: "Cannot verify current password" }, { status: 400 });
      }
      
      // Verify current password
      const validPassword = await verify(
        currentUser.passwordHash,
        data.currentPassword,
        {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        }
      );
      
      if (!validPassword) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      
      // Hash new password
      updateData.passwordHash = await hash(data.newPassword, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
    }
    
    // Update user in database
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    
    // Note: We intentionally skip Stream Chat update for admin profile to avoid serialization issues
    // The Stream Chat user data will be updated when they log in next time
    
    return Response.json({ success: true });
  } catch (error) {
    debug.error("Error updating admin profile:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
