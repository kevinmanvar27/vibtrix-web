import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getRazorpaySettings } from "@/lib/razorpay";

import debug from "@/lib/debug";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Razorpay configuration
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
      },
    });

    if (!settings) {
      return Response.json({
        isConfigured: false,
        message: "Payment settings not found in database",
      });
    }

    if (!settings.razorpayEnabled) {
      return Response.json({
        isConfigured: false,
        message: "Razorpay is disabled in settings",
      });
    }

    if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
      return Response.json({
        isConfigured: false,
        message: "Razorpay API keys are missing",
      });
    }

    // Test API connection (optional)
    try {
      const razorpaySettings = await getRazorpaySettings();
      if (!razorpaySettings) {
        return Response.json({
          isConfigured: false,
          message: "Razorpay settings could not be retrieved",
        });
      }

      return Response.json({
        isConfigured: true,
        message: "Razorpay is properly configured",
      });
    } catch (error) {
      return Response.json({
        isConfigured: false,
        message: "Error validating Razorpay configuration",
      });
    }
  } catch (error) {
    debug.error("Error checking Razorpay status:", error);
    return Response.json(
      { error: "Failed to check Razorpay status" },
      { status: 500 }
    );
  }
}
