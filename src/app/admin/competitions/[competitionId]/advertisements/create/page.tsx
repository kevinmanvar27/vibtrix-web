import { validateRequest } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import CompetitionAdvertisementForm from "../components/CompetitionAdvertisementForm";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

import debug from "@/lib/debug";

export const metadata = {
  title: "Create Competition Advertisement",
};

interface CreateCompetitionAdvertisementPageProps {
  params: {
    competitionId: string;
  };
}

export default async function CreateCompetitionAdvertisementPage({ params }: CreateCompetitionAdvertisementPageProps) {
  const { competitionId } = params;
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

  // Check if competition exists
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!competition) {
    redirect("/admin/competitions");
  }

  return (
    <div className="space-y-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin/competitions">Competitions</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/admin/competitions/${competitionId}`}>{competition.title}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href={`/admin/competitions/${competitionId}/advertisements`}>Advertisements</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Create</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Competition Advertisement</h1>
        <p className="text-muted-foreground">
          Create a new advertisement for the "{competition.title}" competition.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advertisement Details</CardTitle>
          <CardDescription>
            Fill in the details for the new competition-specific advertisement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompetitionAdvertisementForm competitionId={competitionId} />
        </CardContent>
      </Card>
    </div>
  );
}
