import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ManagementUserEditForm from "../components/ManagementUserEditForm";
import { validateRequest } from "@/auth";

export const metadata = {
  title: "Edit Management User",
};

interface ManagementUserEditPageProps {
  params: {
    userId: string;
  };
}

// Define the type that matches what the component expects
type ManagementUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: "ADMIN" | "MANAGER" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: Date;
  avatarUrl: string | null;
  permissions: {
    permission: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
};

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { 
      id: userId,
      isManagementUser: true,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Filter out users with "USER" role since management users should only be ADMIN, MANAGER, or SUPER_ADMIN
  if (user.role === "USER") {
    notFound();
  }

  // Cast to the expected type since we've verified the role is valid
  return user as unknown as ManagementUser;
}

async function getAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function ManagementUserEditPage({ params }: ManagementUserEditPageProps) {
  // Check if the current user is a SUPER_ADMIN
  const { user: currentUser } = await validateRequest();
  
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  const user = await getUser(params.userId);
  const allPermissions = await getAllPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Management User</h1>
        <p className="text-muted-foreground">
          Edit user details, role, and permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                <AvatarFallback>
                  {user.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{user.displayName}</h3>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-medium">
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Role: <span className="font-medium">{user.role}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Created: <span className="font-medium">{user.createdAt.toLocaleDateString()}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <ManagementUserEditForm user={user} allPermissions={allPermissions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}