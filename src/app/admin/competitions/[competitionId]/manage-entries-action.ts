"use server";

import { validateRequest } from "@/auth";
import { revalidatePath } from "next/cache";

import debug from "@/lib/debug";

/**
 * Unified server action to manage competition entries
 * This replaces multiple separate actions with overlapping functionality
 */
export async function manageCompetitionEntries(
  competitionId: string,
  action: string
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isAdmin) {
      throw new Error("Unauthorized - Admin access required");
    }

    // Call the unified API endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/competitions/${competitionId}/manage-entries`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to manage competition entries");
    }

    const result = await response.json();

    // Revalidate the competition pages
    revalidatePath(`/admin/competitions/${competitionId}`);
    revalidatePath(`/competitions/${competitionId}`);

    return {
      success: true,
      message: result.message,
      ...result,
    };
  } catch (error) {
    debug.error("Error managing competition entries:", error);
    return {
      success: false,
      message: "Failed to manage competition entries",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
