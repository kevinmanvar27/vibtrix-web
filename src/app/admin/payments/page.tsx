import { validateRequest } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { IndianRupee, Users } from "lucide-react";
import { redirect } from "next/navigation";
import PaymentsTable from "./components/PaymentsTable";
import { RazorpayStatusAlert } from "@/components/admin/RazorpayStatusAlert";

export const metadata = {
  title: "Payments - Admin Dashboard",
  description: "Manage payments for competitions",
};

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
    prisma.payment.groupBy({
      by: ["competitionId"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
      take: 5,
    }),
  ]);

  // Get competition details for the top competitions
  const competitionsWithDetails = await Promise.all(
    competitionRevenue.map(async (item) => {
      if (!item.competitionId) return { ...item, title: "Unknown" };

      const competition = await prisma.competition.findUnique({
        where: { id: item.competitionId },
        select: { title: true },
      });

      return {
        ...item,
        title: competition?.title || "Unknown",
      };
    })
  );

  return {
    totalPayments,
    completedPayments,
    pendingPayments,
    failedPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
    competitionRevenue: competitionsWithDetails,
  };
}

async function getPayments() {
  const payments = await prisma.payment.findMany({
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
  });

  return payments;
}

export default async function PaymentsPage() {
  const { user } = await validateRequest();

  if (!user || !user.isAdmin) {
    redirect("/admin/login");
  }

  const stats = await getPaymentStats();
  const payments = await getPayments();

  // Filter payments by status
  const completedPayments = payments.filter(
    (payment) => payment.status === "COMPLETED"
  );
  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING"
  );
  const failedPayments = payments.filter(
    (payment) => payment.status === "FAILED"
  );

  return (
    <div className="space-y-6">
      <RazorpayStatusAlert />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage and track payments for competitions
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

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Payments</CardTitle>
              <CardDescription>
                View all payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={payments} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payments</CardTitle>
              <CardDescription>
                Successfully completed payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={completedPayments} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>
                Payment transactions that are still pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={pendingPayments} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>
                Payment transactions that have failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTable payments={failedPayments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
