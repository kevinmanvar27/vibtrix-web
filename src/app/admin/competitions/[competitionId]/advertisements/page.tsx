import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvertisementStatus } from "@prisma/client";
import CompetitionAdvertisementTable from "./components/CompetitionAdvertisementTable";
import { Megaphone } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

import debug from "@/lib/debug";

export const metadata = {
  title: "Competition Advertisement Management",
};

interface CompetitionAdvertisementsPageProps {
  params: {
    competitionId: string;
  };
}

async function getCompetitionAdvertisements(competitionId: string) {
  try {
    return await prisma.advertisement.findMany({
      where: {
        competitionId: competitionId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        media: true,
      },
    });
  } catch (error) {
    debug.error("Error fetching competition advertisements:", error);
    return [];
  }
}

async function getCompetition(competitionId: string) {
  try {
    return await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        id: true,
        title: true,
      },
    });
  } catch (error) {
    debug.error("Error fetching competition:", error);
    return null;
  }
}

export default async function CompetitionAdvertisementsPage({ params }: CompetitionAdvertisementsPageProps) {
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

  const competition = await getCompetition(competitionId);
  if (!competition) {
    redirect("/admin/competitions");
  }

  const advertisements = await getCompetitionAdvertisements(competitionId);

  const activeAds = advertisements.filter(
    (ad) => ad.status === AdvertisementStatus.ACTIVE
  );
  const pausedAds = advertisements.filter(
    (ad) => ad.status === AdvertisementStatus.PAUSED
  );
  const scheduledAds = advertisements.filter(
    (ad) => ad.status === AdvertisementStatus.SCHEDULED
  );
  const expiredAds = advertisements.filter(
    (ad) => ad.status === AdvertisementStatus.EXPIRED
  );

  return (
    <div className="space-y-6">
      <div>
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
            <BreadcrumbLink href="#">Advertisements</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Competition Advertisements</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage advertisements specific to the "{competition.title}" competition.
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Ads</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Advertisements</CardTitle>
              <CardDescription>
                View and manage all advertisements for this competition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionAdvertisementTable
                advertisements={advertisements}
                competitionId={competitionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Advertisements</CardTitle>
              <CardDescription>
                Currently active advertisements for this competition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionAdvertisementTable
                advertisements={activeAds}
                competitionId={competitionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="paused" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paused Advertisements</CardTitle>
              <CardDescription>
                Temporarily paused advertisements for this competition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionAdvertisementTable
                advertisements={pausedAds}
                competitionId={competitionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Advertisements</CardTitle>
              <CardDescription>
                Advertisements scheduled to become active in the future.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionAdvertisementTable
                advertisements={scheduledAds}
                competitionId={competitionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expired Advertisements</CardTitle>
              <CardDescription>
                Advertisements that have passed their expiry date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitionAdvertisementTable
                advertisements={expiredAds}
                competitionId={competitionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
