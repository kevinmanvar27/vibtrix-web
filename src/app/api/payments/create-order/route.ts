import prisma from "@/lib/prisma";
import { createRazorpayOrder, getRazorpaySettings, generateQRCode } from "@/lib/razorpay";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/payments/create-order
 * Create a Razorpay payment order for competition entry
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = await req.json();

    if (!competitionId) {
      return Response.json({ error: "Competition ID is required" }, { status: 400 });
    }

    // Check if Razorpay is enabled
    debug.log("🔍 Checking Razorpay configuration...");
    const razorpaySettings = await getRazorpaySettings();
    if (!razorpaySettings) {
      debug.error("❌ Razorpay settings not available or not properly configured");

      // Get more detailed information about what's missing
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "settings" },
        select: {
          razorpayEnabled: true,
          razorpayKeyId: true,
          razorpayKeySecret: true,
        },
      });

      let errorMessage = "Payment gateway is not configured";

      if (!settings) {
        errorMessage = "Payment settings not found in database";
      } else if (!settings.razorpayEnabled) {
        errorMessage = "Payment gateway is disabled in settings";
      } else if (!settings.razorpayKeyId || !settings.razorpayKeySecret) {
        errorMessage = "Payment gateway API keys are missing";
      }

      return Response.json({ error: errorMessage }, { status: 500 });
    }
    debug.log("✅ Razorpay configuration verified successfully");
    debug.log("Using settings:", {
      keyId: razorpaySettings.keyId.substring(0, 8) + "...",
      source: razorpaySettings.source,
      enabled: razorpaySettings.enabled
    });

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    if (!competition.isPaid || !competition.entryFee) {
      return Response.json({ error: "This competition does not require payment" }, { status: 400 });
    }

    // Check if user has already paid for this competition
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        competitionId,
        status: "COMPLETED",
      },
    });

    if (existingPayment) {
      return Response.json({
        message: "Payment already completed",
        orderId: existingPayment.orderId || existingPayment.transactionId, // Use orderId if available, fall back to transactionId
        paymentId: existingPayment.paymentId,
        alreadyPaid: true
      });
    }

    // Create a receipt ID (must be <= 40 characters for Razorpay)
    // Use shortened versions of IDs and timestamp to stay within limit
    const shortCompId = competitionId.substring(0, 8);
    const shortUserId = user.id.substring(0, 8);
    const timestamp = Date.now().toString().substring(6); // Last 7 digits of timestamp
    const receiptId = `c${shortCompId}_u${shortUserId}_${timestamp}`;

    debug.log(`Generated receipt ID: ${receiptId} (length: ${receiptId.length});`);

    // Create Razorpay order with retry mechanism
    let order;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        order = await createRazorpayOrder(
          competition.entryFee,
          "INR",
          receiptId
        );
        break; // Success, exit the loop
      } catch (error) {
        retryCount++;

        // If it's a rate limit error and we haven't reached max retries
        if (error instanceof Error &&
            error.message.includes("Too many requests") &&
            retryCount < maxRetries) {
          // Wait with exponential backoff (1s, 2s, 4s, etc.)
          const delay = 1000 * Math.pow(2, retryCount - 1);
          debug.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries});`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For other errors or if we've reached max retries, rethrow
          throw error;
        }
      }
    }

    if (!order) {
      throw new Error("Failed to create payment order after multiple attempts");
    }

    // Generate QR code for payment with retry mechanism
    let qrCode = null;
    retryCount = 0; // Reset retry count

    while (retryCount < maxRetries) {
      try {
        qrCode = await generateQRCode(order.id, competition.entryFee);
        break; // Success, exit the loop
      } catch (error) {
        retryCount++;

        // If it's a rate limit error and we haven't reached max retries
        if (error instanceof Error &&
            error.message.includes("Too many requests") &&
            retryCount < maxRetries) {
          // Wait with exponential backoff (1s, 2s, 4s, etc.)
          const delay = 1000 * Math.pow(2, retryCount - 1);
          debug.log(`QR code generation rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries});`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (retryCount >= maxRetries) {
          // If we've reached max retries, continue without QR code
          debug.warn("Failed to generate QR code after multiple attempts, continuing without it");
          break;
        } else {
          // For other errors, rethrow
          throw error;
        }
      }
    }

    // Save payment record in pending state
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        competitionId,
        amount: competition.entryFee,
        currency: "INR",
        status: "PENDING",
        gateway: "RAZORPAY",
        transactionId: order.id, // Store Razorpay order ID in transactionId
        orderId: order.id, // Also store in orderId for consistency
        qrCode,
        updatedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      order,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
      },
      qrCode,
      keyId: razorpaySettings.keyId,
    });
  } catch (error) {
    debug.error("Error creating payment order:", error);

    // Extract more specific error message if available
    let errorMessage = "Failed to create payment order";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific Razorpay API errors
      if (errorMessage.includes("Razorpay API error")) {
        // Log additional details for debugging
        debug.error("Razorpay API error details:", errorMessage);
      }

      // Handle authentication errors specifically
      if (errorMessage.includes("Authentication failed") || errorMessage.includes("API key validation failed")) {
        debug.error("Razorpay authentication error:", errorMessage);
        // Keep the detailed error message for debugging but return a user-friendly message
        errorMessage = "Payment system authentication failed. Please contact support.";
        statusCode = 401;
      }

      // Handle validation errors
      if (errorMessage.includes("validation failed")) {
        debug.error("Razorpay validation error:", errorMessage);
        errorMessage = "Payment system authentication failed. Please contact support.";
        statusCode = 401;
      }
    }

    // Ensure we always return a valid JSON response
    try {
      return Response.json(
        {
          error: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: Math.random().toString(36).substring(7)
        },
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (responseError) {
      debug.error("Error creating error response:", responseError);
      // Fallback response if even the error response fails
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  }
}
