"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(req: NextRequest) {
  try {
    // Validate admin authentication
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data
    const formData = await req.formData();
    const razorpayKeyId = formData.get("razorpayKeyId") as string;
    const razorpayKeySecret = formData.get("razorpayKeySecret") as string;

    debug.log("Received Razorpay keys update request:", {
      razorpayKeyId: razorpayKeyId ? "PRESENT" : "MISSING",
      razorpayKeySecret: razorpayKeySecret ? "PRESENT" : "MISSING",
    });

    // Ensure the columns exist
    try {
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT`;
      await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT`;
    } catch (error) {
      debug.error("Error ensuring Razorpay columns exist:", error);
      // Continue anyway, as the columns might already exist
    }

    // Update the keys using raw SQL to bypass any Prisma schema issues
    await prisma.$executeRaw`
      UPDATE site_settings
      SET "razorpayKeyId" = ${razorpayKeyId},
          "razorpayKeySecret" = ${razorpayKeySecret},
          "razorpayEnabled" = true
      WHERE id = 'settings'
    `;

    // Verify the update
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
      },
    });

    return Response.json({
      success: true,
      message: "Razorpay keys updated successfully",
      settings: {
        razorpayEnabled: settings?.razorpayEnabled,
        razorpayKeyId: settings?.razorpayKeyId ? "PRESENT" : "MISSING",
      },
    });
  } catch (error) {
    debug.error("Error updating Razorpay keys:", error);
    return Response.json(
      { error: "Failed to update Razorpay keys" },
      { status: 500 }
    );
  }
}
