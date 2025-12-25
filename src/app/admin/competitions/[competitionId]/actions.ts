"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export async function disqualifyParticipant(competitionId: string, participantId: string, reason: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  if (!reason.trim()) {
    throw new Error("Disqualification reason is required");
  }

  // Update participant
  const participant = await prisma.competitionParticipant.update({
    where: { id: participantId },
    data: {
      isDisqualified: true,
      disqualifyReason: reason,
    },
  });

  return participant;
}

const prizePaymentSchema = z.object({
  prizeId: z.string(),
  userId: z.string(),
  amount: z.number().min(0, "Amount must be at least 0"),
  upiId: z.string().min(1, "UPI ID is required"),
  notes: z.string().optional(),
});

export async function processPrizePayment(competitionId: string, data: z.infer<typeof prizePaymentSchema>) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  const validatedData = prizePaymentSchema.parse(data);

  // Check if the prize exists and belongs to this competition
  const prize = await prisma.competitionPrize.findFirst({
    where: {
      id: validatedData.prizeId,
      competitionId,
    },
  });

  if (!prize) {
    throw new Error("Prize not found");
  }

  // Check if the user exists
  const userExists = await prisma.user.findUnique({
    where: { id: validatedData.userId },
  });

  if (!userExists) {
    throw new Error("User not found");
  }

  // Check if there's already a payment for this prize and user
  const existingPayment = await prisma.prizePayment.findFirst({
    where: {
      competitionId,
      prizeId: validatedData.prizeId,
      userId: validatedData.userId,
    },
  });

  if (existingPayment) {
    // If the payment is already completed, don't allow processing again
    if (existingPayment.status === "COMPLETED") {
      throw new Error("This prize has already been paid");
    }

    // Update the existing payment
    const payment = await prisma.prizePayment.update({
      where: { id: existingPayment.id },
      data: {
        amount: validatedData.amount,
        upiId: validatedData.upiId,
        notes: validatedData.notes,
        status: "PROCESSING",
      },
    });

    return payment;
  }

  // Create a new payment
  const payment = await prisma.prizePayment.create({
    data: {
      competitionId,
      prizeId: validatedData.prizeId,
      userId: validatedData.userId,
      amount: validatedData.amount,
      upiId: validatedData.upiId,
      notes: validatedData.notes,
      status: "PROCESSING",
    },
  });

  return payment;
}

export async function completePrizePayment(paymentId: string, transactionId: string) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }

  // Update the payment status
  const payment = await prisma.prizePayment.update({
    where: { id: paymentId },
    data: {
      status: "COMPLETED",
      transactionId,
      processedAt: new Date(),
    },
  });

  return payment;
}
