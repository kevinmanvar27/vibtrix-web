"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";

import debug from "@/lib/debug";

const failPaymentSchema = z.object({
  notes: z.string().optional(),
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
    const validatedData = failPaymentSchema.parse(data);

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
        { error: "Cannot mark a completed payment as failed" },
        { status: 400 }
      );
    }

    // Update the payment status
    const updatedPayment = await prisma.prizePayment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        notes: validatedData.notes || payment.notes,
        processedAt: new Date(),
      },
    });

    return Response.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    debug.error("Error marking prize payment as failed:", error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return Response.json(
      { error: "Failed to mark prize payment as failed" },
      { status: 500 }
    );
  }
}
