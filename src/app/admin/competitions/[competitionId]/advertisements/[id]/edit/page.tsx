import { validateRequest } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import CompetitionAdvertisementForm from "../../components/CompetitionAdvertisementForm";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

import debug from "@/lib/debug";

export const metadata = {
  title: "Edit Competition Advertisement",
};

interface EditCompetitionAdvertisementPageProps {
  params: {
    competitionId: string;
    id: string;
  };
}

export default async function EditCompetitionAdvertisementPage({ params }: EditCompetitionAdvertisementPageProps) {
  const { competitionId, id } = params;
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

  // Get competition
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

  // Get advertisement
  const advertisement = await prisma.advertisement.findUnique({
    where: { id },
  });

  if (!advertisement || advertisement.competitionId !== competitionId) {
    redirect(`/admin/competitions/${competitionId}/advertisements`);
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
          <BreadcrumbLink href={`/admin/competitions/${competitionId}/advertisements/${id}`}>{advertisement.title}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Edit</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Advertisement</h1>
        <p className="text-muted-foreground">
          Update the details for "{advertisement.title}"
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advertisement Details</CardTitle>
          <CardDescription>
            Edit the details for this competition-specific advertisement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompetitionAdvertisementForm
            competitionId={competitionId}
            advertisement={{
              ...advertisement,
              url: advertisement.url || undefined
            }}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
