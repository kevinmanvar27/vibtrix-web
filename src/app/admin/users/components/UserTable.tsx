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
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Edit, LogIn, MoreHorizontal, Shield, ShieldAlert, User, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Represents a user in the system
 */
type User = {
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
  /** User's role in the system */
  role: "USER" | "ADMIN" | "MANAGER" | "SUPER_ADMIN";
  /** Whether the user account is active */
  isActive: boolean;
  /** When the user was created */
  createdAt: Date;
  /** Count of user's related entities */
  _count: {
    /** Number of posts created by the user */
    posts: number;
    /** Number of users following this user */
    followers: number;
    /** Number of users this user is following */
    following: number;
  };
};

/**
 * Props for the UserTable component
 */
interface UserTableProps {
  /** Array of users to display in the table */
  users: User[];
}

/**
 * Table component for displaying and managing users
 * Provides actions for editing, viewing profiles, and managing user accounts
 */
export default function UserTable({ users }: UserTableProps) {
  const { toast } = useToast();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Posts</TableHead>
            <TableHead>Followers</TableHead>
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
                    <div
                      className="font-medium cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => window.open(`/users/${user.username}`, '_blank')}
                    >
                      {user.displayName}
                    </div>
                    <div
                      className="text-sm text-muted-foreground cursor-pointer hover:text-blue-600 hover:underline"
                      onClick={() => window.open(`/users/${user.username}`, '_blank')}
                    >
                      @{user.username}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.role === "SUPER_ADMIN" ? (
                    <ShieldAlert className="h-4 w-4 text-purple-500" />
                  ) : user.role === "MANAGER" ? (
                    <Shield className="h-4 w-4 text-indigo-500" />
                  ) : user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-blue-500" />
                  ) : (
                    <div className="flex h-2 w-2 rounded-full bg-gray-300" />
                  )}
                  <span>
                    {user.role === "SUPER_ADMIN" ? "Super Admin" :
                      user.role === "MANAGER" ? "Manager" :
                        user.role === "ADMIN" ? "Admin" : "User"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {user.isActive ? (
                    <div className="flex h-2 w-2 rounded-full bg-green-500" />
                  ) : (
                    <div className="flex h-2 w-2 rounded-full bg-red-500" />
                  )}
                  <span>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </TableCell>
              <TableCell>{user._count.posts}</TableCell>
              <TableCell>{user._count.followers}</TableCell>
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
                      <Link href={`/admin/users/${user.id}`}>
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
                      <User className="mr-2 h-4 w-4" />
                      View User Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          // Call the login-as-user API
                          const response = await fetch('/api/admin/login-as-user', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ userId: user.id }),
                          });

                          const data = await response.json();

                          if (!response.ok) {
                            throw new Error(data.error || 'Failed to login as user');
                          }

                          // Open the user profile in a new tab
                          const newTab = window.open(`/users/${user.username}`, '_blank');

                          toast({
                            title: 'Success',
                            description: `You are now logged in as ${user.displayName} in the new tab`,
                          });
                        } catch (error) {
                          toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: error instanceof Error ? error.message : 'Failed to login as user',
                          });
                        }
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login as User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.isAdmin ? (
                      <DropdownMenuItem>
                        <UserX className="mr-2 h-4 w-4" />
                        Remove Admin
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {user.isActive ? (
                      <DropdownMenuItem>
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <UserX className="mr-2 h-4 w-4" />
                        Activate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
