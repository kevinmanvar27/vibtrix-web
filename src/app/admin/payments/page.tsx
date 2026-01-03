import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { IndianRupee, Users } from "lucide-react";
import { redirect } from "next/navigation";
import PaymentsTable from "./components/PaymentsTable";
import { RazorpayStatusAlert } from "@/components/admin/RazorpayStatusAlert";
import { validateRequest } from "@/auth";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentStatus } from "@prisma/client";

export const metadata = {
  title: "Payments - Admin Dashboard",
  description: "Manage payments for competitions",
};

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface PaymentsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    status?: string;
  };
}

// OPTIMIZED: Combined stats query - removed N+1 for competition titles
async function getPaymentStats() {
  const [
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    totalRevenue,
    competitionRevenue,
  ] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "COMPLETED" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    // OPTIMIZED: Get top 5 competitions with revenue in a single query
    // Using actual table names from @@map() in schema.prisma
    prisma.$queryRaw<Array<{
      competitionId: string;
      title: string;
      totalAmount: number;
      paymentCount: bigint;
    }>>`
      SELECT 
        p.competitionId,
        c.title,
        SUM(p.amount) as totalAmount,
        COUNT(p.id) as paymentCount
      FROM payments p
      LEFT JOIN competitions c ON p.competitionId = c.id
      WHERE p.status = 'COMPLETED' AND p.competitionId IS NOT NULL
      GROUP BY p.competitionId, c.title
      ORDER BY totalAmount DESC
      LIMIT 5
    `,
  ]);

  return {
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
    competitionRevenue: competitionRevenue.map(item => ({
      competitionId: item.competitionId,
      title: item.title || "Unknown",
      _sum: { amount: Number(item.totalAmount) },
      _count: Number(item.paymentCount),
    })),
  };
}

async function getPayments(page: number = 1, limit: number = 50, status?: string) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (status && status !== 'all') {
    where.status = status.toUpperCase() as PaymentStatus;
  }

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        competition: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

// OPTIMIZED: Single query for all counts
async function getPaymentCounts() {
  const counts = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const countMap = new Map(counts.map(c => [c.status, c._count.id]));
  
  return {
    allCount: counts.reduce((sum, c) => sum + c._count.id, 0),
    completedCount: countMap.get(PaymentStatus.COMPLETED) || 0,
    pendingCount: countMap.get(PaymentStatus.PENDING) || 0,
    failedCount: countMap.get(PaymentStatus.FAILED) || 0,
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

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    redirect("/admin/login");
  }

  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '50', 10);
  const status = searchParams.status;

  const [stats, { payments, totalCount, totalPages, currentPage }, counts] = await Promise.all([
    getPaymentStats(),
    getPayments(page, limit, status),
    getPaymentCounts(),
  ]);

  return (
    <div className="space-y-6">
      <RazorpayStatusAlert />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage and track payments for competitions
          <span className="ml-2 text-sm">({totalCount} payments)</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.completedPayments} completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPayments} pending, {stats.failedPayments} failed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Competitions by Revenue</CardTitle>
          <CardDescription>
            Competitions that have generated the most revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.competitionRevenue.map((item) => (
              <div key={item.competitionId || "unknown"} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item._count} payments
                  </p>
                </div>
                <div className="font-medium">₹{item._sum.amount?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={status || "all"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" asChild>
            <a href="/admin/payments">All ({counts.allCount})</a>
          </TabsTrigger>
          <TabsTrigger value="completed" asChild>
            <a href="/admin/payments?status=completed">Completed ({counts.completedCount})</a>
          </TabsTrigger>
          <TabsTrigger value="pending" asChild>
            <a href="/admin/payments?status=pending">Pending ({counts.pendingCount})</a>
          </TabsTrigger>
          <TabsTrigger value="failed" asChild>
            <a href="/admin/payments?status=failed">Failed ({counts.failedCount})</a>
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>
              {status === 'completed' ? 'Completed' : 
               status === 'pending' ? 'Pending' : 
               status === 'failed' ? 'Failed' : 'All'} Payments
            </CardTitle>
            <CardDescription>
              {status === 'completed' ? 'Successfully completed payment transactions' :
               status === 'pending' ? 'Payment transactions that are still pending' :
               status === 'failed' ? 'Payment transactions that have failed' :
               'View all payment transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton />}>
              <PaymentsTable 
                payments={payments}
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
