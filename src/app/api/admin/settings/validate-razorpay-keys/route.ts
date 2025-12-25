import { validateRequest } from "@/auth";
import { validateRazorpayKeys } from "@/lib/razorpay";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(req: NextRequest) {
  try {
    // Validate admin authentication
    const { user } = await validateRequest();
    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const data = await req.json();
    const { keyId, keySecret } = data;

    if (!keyId) {
      return Response.json({
        valid: false,
        error: "Key ID is required"
      }, { status: 400 });
    }

    // Validate the format of the keys
    if (!keyId.startsWith('rzp_')) {
      return Response.json({
        valid: false,
        error: "Invalid Key ID format. Must start with 'rzp_'"
      }, { status: 400 });
    }

    if (keySecret && keySecret.length < 20) {
      return Response.json({
        valid: false,
        error: "Key Secret is too short. Should be at least 20 characters"
      }, { status: 400 });
    }

    debug.log("Validating Razorpay keys...");
    debug.log("Key ID:", keyId.substring(0, 8) + "...");
    debug.log("Key Secret:", keySecret ? "[PROVIDED]" : "[NOT PROVIDED]");

    // If no key secret is provided, we can't fully validate
    if (!keySecret) {
      return Response.json({
        valid: false,
        error: "Key Secret is required for validation"
      });
    }

    // Validate the keys with Razorpay API
    const validation = await validateRazorpayKeys(keyId, keySecret);

    if (!validation.valid) {
      return Response.json({
        valid: false,
        error: validation.error || "Failed to validate Razorpay API keys"
      });
    }

    return Response.json({
      valid: true,
      message: "Razorpay API keys validated successfully"
    });
  } catch (error) {
    debug.error("Error validating Razorpay keys:", error);
    return Response.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Failed to validate Razorpay keys"
      },
      { status: 500 }
    );
  }
}
