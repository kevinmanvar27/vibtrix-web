import { validateRequest } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import debug from "@/lib/debug";

interface AdvertisementPageProps {
  params: {
    id: string;
  };
}

export default async function AdvertisementPage({
  params,
}: AdvertisementPageProps) {
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

  // Fetch advertisement
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: params.id },
    include: {
      media: true,
    },
  });

  if (!advertisement) {
    redirect("/admin/advertisements");
  }

  const getStatusBadge = (status: AdvertisementStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/20 dark:text-green-400">Active</Badge>;
      case "PAUSED":
        return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Paused</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Scheduled</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/advertisements" className="flex items-center text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to advertisements
          </Link>
          <h1 className="text-3xl font-bold">{advertisement.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(advertisement.status)}
            <span className="text-muted-foreground text-sm">
              Created on {format(advertisement.createdAt, "PPP")}
            </span>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/advertisements/edit/${advertisement.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Advertisement
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Advertisement Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                {advertisement.adType === "IMAGE" ? (
                  <div className="relative aspect-video">
                    <Image
                      src={advertisement.media.url}
                      alt={advertisement.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-video">
                    <CustomVideoPlayer
                      src={advertisement.media.url}
                      poster={undefined}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                <p>{advertisement.adType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Skip Duration</h3>
                <p>{advertisement.skipDuration} seconds</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Display Frequency</h3>
                <p>Every {advertisement.displayFrequency} posts</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium">Start Date</h3>
                  <p className="text-muted-foreground">
                    {format(advertisement.scheduleDate, "PPP")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium">End Date</h3>
                  <p className="text-muted-foreground">
                    {format(advertisement.expiryDate, "PPP")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
