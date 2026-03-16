import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManagementUserTable from "./components/ManagementUserTable";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import CreateManagementUserButton from "./components/CreateManagementUserButton";

export const metadata = {
  title: "Management Users",
};

async function getManagementUsers() {
  return await prisma.user.findMany({
    where: {
      // Only show management users (admin, manager, super_admin)
      role: {
        in: ["ADMIN", "MANAGER", "SUPER_ADMIN"],
      },
    },
    orderBy: { createdAt: "desc" },
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
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });
}

export default async function ManagementUsersPage() {
  // Check if the current user is a SUPER_ADMIN
  const { user } = await validateRequest();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  const managementUsers = await getManagementUsers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management Users</h1>
          <p className="text-muted-foreground">
            Manage users who have access to the admin area.
          </p>
        </div>
        <CreateManagementUserButton />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Management Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Management Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementUserTable users={managementUsers} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementUserTable users={managementUsers.filter(user => user.role === "ADMIN")} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="managers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manager Users</CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementUserTable users={managementUsers.filter(user => user.role === "MANAGER")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
