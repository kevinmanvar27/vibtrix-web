"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Edit, LogIn, MoreHorizontal, Shield, ShieldAlert, ShieldCheck, Trash } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

/**
 * Props for the ManagementUserTable component
 */
interface ManagementUserTableProps {
  /** Array of management users to display in the table */
  users: {
    /** User's unique identifier */
    id: string;
    /** User's username */
    username: string;
    /** User's display name */
    displayName: string;
    /** User's email address */
    email: string | null;
    /** URL to user's avatar image */
    avatarUrl: string | null;
    /** Whether the user has admin privileges */
    isAdmin: boolean;
    /** User's role (e.g., Admin, Moderator, etc.) */
    role: string;
    /** Whether the user account is active */
    isActive: boolean;
    /** When the user was created */
    createdAt: Date;
    /** User's assigned permissions */
    permissions: {
      permission: {
        /** Permission's unique identifier */
        id: string;
        /** Permission name */
        name: string;
        /** Permission description */
        description: string | null;
      };
    }[];
  }[];
}

/**
 * Table component for displaying and managing management users
 * Provides actions for editing, viewing profiles, and deleting users
 */
export default function ManagementUserTable({ users }: ManagementUserTableProps) {
  const { toast } = useToast();

  /**
   * Returns the appropriate icon based on user role
   * @param role The user's role
   * @returns The icon component to display
   */
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "ADMIN":
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      case "MANAGER":
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
                    <AvatarFallback>
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  <span>{user.role}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  <span>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.permissions.length > 0 ? (
                    user.permissions.slice(0, 3).map((p) => (
                      <Badge key={p.permission.id} variant="outline" className="text-xs">
                        {p.permission.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs">No specific permissions</span>
                  )}
                  {user.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{user.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDistanceToNow(user.createdAt, { addSuffix: true })}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/management-users/${user.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        try {
                          // Open user profile in a new tab without logging out from admin
                          window.open(`/users/${user.username}`, '_blank');

                          toast({
                            title: 'Success',
                            description: `Opened ${user.displayName}'s profile in a new tab`,
                          });
                        } catch (error) {
                          // Handle error when trying to open user profile
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Failed to open user profile',
                          });
                        }
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      View User Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No management users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
