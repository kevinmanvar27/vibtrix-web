import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvertisementTable from "../components/AdvertisementTable";
import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

import debug from "@/lib/debug";

export const metadata = {
  title: "Global Advertisement Management",
};

async function getAdvertisements() {
  try {
    // Only fetch global advertisements (those without a competitionId)
    return await prisma.advertisement.findMany({
      where: {
        competitionId: null, // Only get advertisements that are not associated with a competition
      },
      orderBy: { createdAt: "desc" },
      include: {
        media: true,
      },
    });
  } catch (error) {
    debug.error("Error fetching advertisements:", error);
    return [];
  }
}

export default async function AdvertisementsListPage() {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  const advertisements = await getAdvertisements();

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
        <h1 className="text-3xl font-bold tracking-tight">Global Advertisement Management</h1>
        <p className="text-muted-foreground">
          Create and manage global advertisements that will be shown to users across the entire platform.
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
              <CardTitle>All Global Advertisements</CardTitle>
              <CardDescription>
                View and manage all global advertisements in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementTable advertisements={advertisements} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Global Advertisements</CardTitle>
              <CardDescription>
                These global advertisements are currently being shown to users across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementTable advertisements={activeAds} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="paused" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paused Global Advertisements</CardTitle>
              <CardDescription>
                These global advertisements have been manually paused.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementTable advertisements={pausedAds} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Global Advertisements</CardTitle>
              <CardDescription>
                These global advertisements are scheduled to start in the future.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementTable advertisements={scheduledAds} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expired Global Advertisements</CardTitle>
              <CardDescription>
                These global advertisements have passed their expiry date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvertisementTable advertisements={expiredAds} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
