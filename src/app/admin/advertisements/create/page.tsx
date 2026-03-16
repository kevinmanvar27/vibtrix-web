import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdvertisementForm from "../components/AdvertisementForm";

import debug from "@/lib/debug";

export const metadata = {
  title: "Create Global Advertisement",
};

export default async function CreateAdvertisementPage() {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  // Check if advertisements feature is enabled
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { advertisementsEnabled: true },
    });

    // Only redirect if settings exist and advertisements are explicitly disabled
    if (settings && settings.advertisementsEnabled === false) {
      redirect("/admin/settings");
    }
  } catch (error) {
    debug.error("Error checking advertisement settings:", error);
    // Continue without redirecting if there's an error
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Global Advertisement</h1>
        <p className="text-muted-foreground mt-2">
          Create a new global advertisement to be shown to users across the entire platform.
        </p>
      </div>

      <AdvertisementForm mode="create" />
    </div>
  );
}
