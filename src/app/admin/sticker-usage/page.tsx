import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StickerUsageView from "./components/StickerUsageView";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { validateRequest } from "@/auth";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface StickerUsagePageProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default async function StickerUsagePage({ searchParams }: StickerUsagePageProps) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    redirect("/login");
  }

  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '50', 10);
  const skip = (page - 1) * limit;

  // Get paginated sticker usage data with related sticker info
  // OPTIMIZED: Use groupBy for efficient counting instead of N+1 queries
  const [stickerUsageData, totalCount, stickers, usageCounts, deletedCounts] = await Promise.all([
    prisma.stickerUsage.findMany({
      include: {
        sticker: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.stickerUsage.count(),
    // Get all stickers with basic info
    prisma.promotionSticker.findMany({
      select: {
        id: true,
        title: true,
        limit: true,
      },
    }),
    // Get total usage counts grouped by sticker
    prisma.stickerUsage.groupBy({
      by: ['stickerId'],
      _count: { id: true },
    }),
    // Get deleted usage counts grouped by sticker
    prisma.stickerUsage.groupBy({
      by: ['stickerId'],
      where: { isDeleted: true },
      _count: { id: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Build lookup maps for efficient access
  const usageCountMap = new Map(usageCounts.map(u => [u.stickerId, u._count.id]));
  const deletedCountMap = new Map(deletedCounts.map(d => [d.stickerId, d._count.id]));

  // Calculate statistics for each sticker
  const stickerStatistics = stickers.map((sticker) => {
    const totalUsages = usageCountMap.get(sticker.id) || 0;
    const deletedUsages = deletedCountMap.get(sticker.id) || 0;

    return {
      id: sticker.id,
      title: sticker.title,
      limit: sticker.limit,
      totalUsages,
      activeUsages: totalUsages - deletedUsages,
      deletedUsages,
    };
  });

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sticker Usage Statistics</h1>
        <p className="text-muted-foreground">
          View sticker usage across the platform
          <span className="ml-2 text-sm">({totalCount} total usages)</span>
        </p>
      </div>

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
          <Suspense fallback={<TableSkeleton />}>
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
                {stickerUsageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No sticker usage data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  stickerUsageData.map((usage) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </Suspense>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <Link href={`/admin/sticker-usage?page=${page - 1}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Link>
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <Link href={`/admin/sticker-usage?page=${page + 1}`}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
