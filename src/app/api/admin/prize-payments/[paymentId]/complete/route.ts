"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

import debug from "@/lib/debug";

const completePaymentSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = params;
    const data = await req.json();
    
    // Validate the request body
    const validatedData = completePaymentSchema.parse(data);

    // Check if the payment exists
    const payment = await prisma.prizePayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return Response.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if the payment is already completed
    if (payment.status === "COMPLETED") {
      return Response.json(
        { error: "Payment is already completed" },
        { status: 400 }
      );
    }

    // Update the payment status
    const updatedPayment = await prisma.prizePayment.update({
      where: { id: paymentId },
      data: {
        status: "COMPLETED",
        transactionId: validatedData.transactionId,
        processedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    debug.error("Error completing prize payment:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: "Failed to complete prize payment" },
      { status: 500 }
    );
  }
}
