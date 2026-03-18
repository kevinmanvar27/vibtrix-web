import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserTable from "./components/UserTable";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export const metadata = {
  title: "User Management",
};

// Enable ISR with 60 second revalidation for admin pages
export const revalidate = 60;

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
}

async function getUsers(page: number = 1, limit: number = 50, status?: string) {
  const skip = (page - 1) * limit;
  
  const where = {
    role: "USER" as const,
    ...(status === 'active' ? { isActive: true } : {}),
    ...(status === 'inactive' ? { isActive: false } : {}),
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        isAdmin: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

// OPTIMIZED: Get counts in a single groupBy query
async function getUserCounts() {
  const counts = await prisma.user.groupBy({
    by: ['isActive'],
    where: { role: "USER" },
    _count: { id: true },
  });

  const countMap = new Map(counts.map(c => [c.isActive, c._count.id]));
  const activeCount = countMap.get(true) || 0;
  const inactiveCount = countMap.get(false) || 0;

  return {
    totalCount: activeCount + inactiveCount,
    activeCount,
    inactiveCount,
  };
}

// Loading skeleton for the table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default async function UsersPage(props: UsersPageProps) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '50', 10);
  const status = searchParams.status;

  // Run both queries in parallel
  const [{ users, totalCount, totalPages, currentPage }, counts] = await Promise.all([
    getUsers(page, limit, status),
    getUserCounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, view their activity, and moderate accounts.
          <span className="ml-2 text-sm">({totalCount} total users)</span>
        </p>
      </div>

      <Tabs defaultValue={status || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/admin/users">All Users ({counts.totalCount})</Link>
          </TabsTrigger>
          <TabsTrigger value="active" asChild>
            <Link href="/admin/users?status=active">Active ({counts.activeCount})</Link>
          </TabsTrigger>
          <TabsTrigger value="inactive" asChild>
            <Link href="/admin/users?status=inactive">Inactive ({counts.inactiveCount})</Link>
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'active' ? 'Active' : status === 'inactive' ? 'Inactive' : 'All'} Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <UserTable 
                users={users} 
                pagination={{
                  currentPage,
                  totalPages,
                  totalCount,
                }}
              />
            </Suspense>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
