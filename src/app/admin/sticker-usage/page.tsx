import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import StickerUsageView from "./components/StickerUsageView";
import { Eye } from "lucide-react";

export default async function StickerUsagePage() {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    redirect("/login");
  }

  // Get all sticker usage data with related media and post information
  const stickerUsageData = await prisma.stickerUsage.findMany({
    include: {
      sticker: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get media information for each sticker usage
  const enhancedStickerUsageData = await Promise.all(
    stickerUsageData.map(async (usage) => {
      // Find the media that has this URL
      const media = await prisma.media.findFirst({
        where: { url: usage.mediaUrl },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                }
              }
            }
          }
        }
      });

      return {
        ...usage,
        media,
      };
    })
  );

  // Get sticker usage statistics
  const stickerStats = await prisma.promotionSticker.findMany({
    include: {
      _count: {
        select: {
          usages: true,
        },
      },
      usages: {
        select: {
          isDeleted: true,
        },
      },
    },
  });

  // Calculate active and deleted counts for each sticker
  const stickerStatistics = stickerStats.map(sticker => {
    const totalUsages = sticker._count.usages;
    const deletedUsages = sticker.usages.filter(usage => usage.isDeleted).length;
    const activeUsages = totalUsages - deletedUsages;

    return {
      id: sticker.id,
      title: sticker.title,
      limit: sticker.limit,
      totalUsages,
      activeUsages,
      deletedUsages,
    };
  });

  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Sticker Usage Statistics</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sticker Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sticker</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Total Uses</TableHead>
                <TableHead>Active Uses</TableHead>
                <TableHead>Deleted Uses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stickerStatistics.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell>{stat.title}</TableCell>
                  <TableCell>
                    {stat.limit
                      ? <span className={stat.activeUsages >= stat.limit ? "text-destructive font-bold" : ""}>
                        {stat.activeUsages}/{stat.limit}
                      </span>
                      : "No limit"}
                  </TableCell>
                  <TableCell>{stat.totalUsages}</TableCell>
                  <TableCell>{stat.activeUsages}</TableCell>
                  <TableCell>{stat.deletedUsages}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sticker Usage History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sticker</TableHead>
                <TableHead>Media URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enhancedStickerUsageData.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>{usage.sticker.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{usage.mediaUrl}</TableCell>
                  <TableCell>
                    <Badge variant={usage.isDeleted ? "destructive" : "default"}>
                      {usage.isDeleted ? "Deleted" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(usage.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{new Date(usage.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <StickerUsageView usage={usage} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
