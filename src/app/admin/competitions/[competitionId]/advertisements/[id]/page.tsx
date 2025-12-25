import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Clock, Edit, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import debug from "@/lib/debug";

interface AdvertisementPageProps {
  params: {
    competitionId: string;
    id: string;
  };
}

export default async function CompetitionAdvertisementPage({
  params,
}: AdvertisementPageProps) {
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
    include: {
      media: true,
    },
  });

  if (!advertisement || advertisement.competitionId !== competitionId) {
    redirect(`/admin/competitions/${competitionId}/advertisements`);
  }

  const getStatusBadge = (status: AdvertisementStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "PAUSED":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Paused</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Scheduled</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
          <BreadcrumbLink href="#">{advertisement.title}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{advertisement.title}</h1>
          <p className="text-muted-foreground">
            Advertisement details
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/competitions/${competitionId}/advertisements`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/competitions/${competitionId}/advertisements/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Advertisement
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Advertisement Preview</CardTitle>
            <CardDescription>
              How the advertisement appears to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md overflow-hidden border">
              {advertisement.media.type === "IMAGE" ? (
                <div className="relative w-full aspect-video">
                  <Image
                    src={advertisement.media.url}
                    alt={advertisement.title}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <CustomVideoPlayer
                  src={advertisement.media.url}
                  poster={undefined}
                  className="w-full aspect-video"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advertisement Details</CardTitle>
            <CardDescription>
              Configuration and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">{getStatusBadge(advertisement.status)}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd className="mt-1">{advertisement.adType}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Skip Duration</dt>
                <dd className="mt-1 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {advertisement.skipDuration} seconds
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Display Frequency</dt>
                <dd className="mt-1">Every {advertisement.displayFrequency} posts</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Schedule Date</dt>
                <dd className="mt-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {format(advertisement.scheduleDate, "PPP")}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground">Expiry Date</dt>
                <dd className="mt-1 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  {format(advertisement.expiryDate, "PPP")}
                </dd>
              </div>
              {advertisement.url && (
                <div className="flex flex-col">
                  <dt className="text-sm font-medium text-muted-foreground">Destination URL</dt>
                  <dd className="mt-1 flex items-center">
                    <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <a
                      href={advertisement.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {advertisement.url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
