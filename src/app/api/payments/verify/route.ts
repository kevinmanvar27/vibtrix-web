import prisma from "@/lib/prisma";
import { getRazorpaySettings, verifyRazorpayPayment } from "@/lib/razorpay";
import { NextRequest } from "next/server";
import debug from "@/lib/debug";
import { getAuthenticatedUser } from "@/lib/api-auth";

/**
 * POST /api/payments/verify
 * Verify a Razorpay payment and update competition participation
 * Supports both JWT (mobile) and session (web) authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Support both JWT and session authentication
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, paymentId, signature, competitionId } = await req.json();

    if (!orderId || !paymentId || !signature || !competitionId) {
      return Response.json(
        { error: "Missing required payment details" },
        { status: 400 }
      );
    }

    // Get Razorpay settings for payments
    const settings = await getRazorpaySettings();
    if (!settings) {
      return Response.json(
        { error: "Payment gateway is not configured" },
        { status: 500 }
      );
    }

    // Verify payment signature
    const isValid = verifyRazorpayPayment(
      orderId,
      paymentId,
      signature,
      settings.keySecret
    );

    if (!isValid) {
      return Response.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    debug.log("Payment verification successful, proceeding with database updates");

    // Update payment record
    // Try to find payment by transactionId or orderId
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transactionId: orderId },
          { orderId: orderId }
        ],
        userId: user.id,
      },
    });

    if (!payment) {
      return Response.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paymentId,
        signature,
        updatedAt: new Date(),
      },
    });

    // Check if participant record exists
    const existingParticipant = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId,
        },
      },
    });

    if (existingParticipant) {
      // Update existing participant record to mark as paid
      await prisma.competitionParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          hasPaid: true,
        },
      });
    } else {
      // Create a new participant record with hasPaid set to true
      await prisma.competitionParticipant.create({
        data: {
          userId: user.id,
          competitionId,
          hasPaid: true,
          hasAppealedDisqualification: false, // Default value
        },
      });
    }

    return Response.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    debug.error("Error verifying payment:", error);
    return Response.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
