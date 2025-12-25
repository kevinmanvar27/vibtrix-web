import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import CompetitionFeedSettingsClientWrapper from "./CompetitionFeedSettingsClientWrapper";
import CompetitionDynamicTabs from "./CompetitionDynamicTabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight } from "lucide-react";

import debug from "@/lib/debug";

interface CompetitionFeedSettingsPageProps {
  params: {
    competitionId: string;
  };
}

export default async function CompetitionFeedSettingsPage({ params }: CompetitionFeedSettingsPageProps) {
  const { competitionId } = params;
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  // Check if competition exists
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: {
      id: true,
      title: true,
      showStickeredMedia: true,
      showFeedStickers: true,
    },
  });

  if (!competition) {
    redirect("/admin/competitions");
  }

  // Allow both settings to be disabled

  // Get competition-specific feed stickers
  const feedStickers = await prisma.promotionSticker.findMany({
    where: {
      competitionId: competitionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Find the default sticker for this competition (if any)
  const defaultSticker = await prisma.promotionSticker.findFirst({
    where: {
      competitionId: competitionId,
      id: `default-${competitionId}`, // Convention for default stickers
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
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
          <span>Feed Settings</span>
        </BreadcrumbItem>
      </Breadcrumb>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>Competition Feed Settings</CardTitle>
          </div>
          <CardDescription>
            Configure how media appears in the feed for this competition
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        <CompetitionFeedSettingsClientWrapper
          competitionId={competitionId}
          showFeedStickers={competition.showFeedStickers}
          showStickeredMedia={competition.showStickeredMedia}
        >
          <CompetitionDynamicTabs
            competitionId={competitionId}
            initialShowFeedStickers={competition.showFeedStickers}
            initialShowStickeredMedia={competition.showStickeredMedia}
            defaultSticker={defaultSticker}
            feedStickers={feedStickers}
          />
        </CompetitionFeedSettingsClientWrapper>
      </div>
    </div>
  );
}
