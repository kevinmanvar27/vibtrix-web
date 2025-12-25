import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleTable from "./components/RoleTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Role Management",
};

async function getRoles() {
  // Get all roles from the database
  // For now, we'll just return the predefined roles
  return [
    {
      id: "1",
      name: "SUPER_ADMIN",
      description: "Full access to all features and settings",
      isSystem: true,
    },
    {
      id: "2",
      name: "ADMIN",
      description: "Access to most administrative features",
      isSystem: true,
    },
    {
      id: "3",
      name: "MANAGER",
      description: "Access to content management features",
      isSystem: true,
    },
    {
      id: "4",
      name: "USER",
      description: "Regular user with standard permissions",
      isSystem: true,
    },
  ];
}

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/roles/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Roles</TabsTrigger>
          <TabsTrigger value="system">System Roles</TabsTrigger>
          <TabsTrigger value="custom">Custom Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleTable roles={roles} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleTable roles={roles.filter(role => role.isSystem)} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleTable roles={roles.filter(role => !role.isSystem)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
