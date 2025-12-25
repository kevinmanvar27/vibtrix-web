import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdvertisementStatus } from "@prisma/client";

import debug from "@/lib/debug";

// Schema for status update
const statusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "SCHEDULED", "EXPIRED"]),
});

// PATCH /api/admin/advertisements/[id]/status - Update advertisement status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest();

    // Check if user has admin access
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if advertisements feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { advertisementsEnabled: true },
    });

    if (!settings?.advertisementsEnabled) {
      return NextResponse.json({ error: "Advertisements feature is currently disabled" }, { status: 403 });
    }

    const { id } = params;

    // Check if advertisement exists
    const existingAdvertisement = await prisma.advertisement.findUnique({
      where: { id },
    });

    if (!existingAdvertisement) {
      return NextResponse.json({ error: "Advertisement not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const validationResult = statusUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // Update advertisement status
    const advertisement = await prisma.advertisement.update({
      where: { id },
      data: { status },
      include: {
        media: {
          select: {
            url: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(advertisement);
  } catch (error) {
    debug.error("Error updating advertisement status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
