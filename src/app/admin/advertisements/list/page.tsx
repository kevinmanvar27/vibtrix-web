import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdvertisementTable from "../components/AdvertisementTable";
import prisma from "@/lib/prisma";
import { AdvertisementStatus } from "@prisma/client";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

import debug from "@/lib/debug";

export const metadata = {
  title: "Global Advertisement Management",
};

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface AdvertisementsListPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
}

async function getAdvertisements(page: number = 1, limit: number = 25, status?: string) {
  const skip = (page - 1) * limit;

  try {
    // Build where clause
    const where: any = {
      competitionId: null, // Only get global advertisements
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase() as AdvertisementStatus;
    }

    const [advertisements, totalCount] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          media: true,
        },
      }),
      prisma.advertisement.count({ where }),
    ]);

    return {
      advertisements,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    debug.error("Error fetching advertisements:", error);
    return {
      advertisements: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
    };
  }
}

// Get counts for tabs - OPTIMIZED: Use groupBy instead of 5 separate count queries
async function getAdvertisementCounts() {
  try {
    // Single groupBy query to get all status counts at once
    const statusCounts = await prisma.advertisement.groupBy({
      by: ['status'],
      where: { competitionId: null }, // Only global advertisements
      _count: { status: true },
    });

    // Convert to object for easy access
    const countMap: Record<string, number> = {};
    statusCounts.forEach((item) => {
      countMap[item.status] = item._count.status;
    });

    // Calculate total from grouped results
    const allCount = statusCounts.reduce((sum, item) => sum + item._count.status, 0);

    return {
      allCount,
      activeCount: countMap[AdvertisementStatus.ACTIVE] || 0,
      pausedCount: countMap[AdvertisementStatus.PAUSED] || 0,
      scheduledCount: countMap[AdvertisementStatus.SCHEDULED] || 0,
      expiredCount: countMap[AdvertisementStatus.EXPIRED] || 0,
    };
  } catch (error) {
    debug.error("Error fetching advertisement counts:", error);
    return { allCount: 0, activeCount: 0, pausedCount: 0, scheduledCount: 0, expiredCount: 0 };
  }
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default async function AdvertisementsListPage({ searchParams }: AdvertisementsListPageProps) {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '25', 10);
  const status = searchParams.status;

  const [{ advertisements, totalCount, totalPages, currentPage }, counts] = await Promise.all([
    getAdvertisements(page, limit, status),
    getAdvertisementCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Advertisement Management</h1>
        <p className="text-muted-foreground">
          Create and manage global advertisements that will be shown to users across the entire platform.
          <span className="ml-2 text-sm">({totalCount} advertisements)</span>
        </p>
      </div>

      <Tabs defaultValue={status || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href="/admin/advertisements/list">All ({counts.allCount})</a>
          </TabsTrigger>
          <TabsTrigger value="active" asChild>
            <a href="/admin/advertisements/list?status=active">Active ({counts.activeCount})</a>
          </TabsTrigger>
          <TabsTrigger value="paused" asChild>
            <a href="/admin/advertisements/list?status=paused">Paused ({counts.pausedCount})</a>
          </TabsTrigger>
          <TabsTrigger value="scheduled" asChild>
            <a href="/admin/advertisements/list?status=scheduled">Scheduled ({counts.scheduledCount})</a>
          </TabsTrigger>
          <TabsTrigger value="expired" asChild>
            <a href="/admin/advertisements/list?status=expired">Expired ({counts.expiredCount})</a>
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'active' ? 'Active' : 
               status === 'paused' ? 'Paused' : 
               status === 'scheduled' ? 'Scheduled' : 
               status === 'expired' ? 'Expired' : 'All'} Global Advertisements
            </CardTitle>
            <CardDescription>
              {status === 'active' ? 'These global advertisements are currently being shown to users across the platform.' :
               status === 'paused' ? 'These global advertisements have been manually paused.' :
               status === 'scheduled' ? 'These global advertisements are scheduled to start in the future.' :
               status === 'expired' ? 'These global advertisements have passed their expiry date.' :
               'View and manage all global advertisements in the system.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <AdvertisementTable 
                advertisements={advertisements}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                status={status || 'all'}
              />
            </Suspense>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
