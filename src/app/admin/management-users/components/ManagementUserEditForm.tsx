"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { updateManagementUser } from "../actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import debug from "@/lib/debug";

const userEditSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional(),
  role: z.enum(["ADMIN", "MANAGER"], {
    message: "Please select a valid role.",
  }),
  isActive: z.boolean(),
  permissions: z.array(z.string()),
});

type UserEditFormValues = z.infer<typeof userEditSchema>;

interface ManagementUserEditFormProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string | null;
    role: "ADMIN" | "MANAGER" | "SUPER_ADMIN";
    isActive: boolean;
    permissions: {
      permission: {
        id: string;
        name: string;
        description: string | null;
      };
    }[];
  };
  allPermissions: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export default function ManagementUserEditForm({ user, allPermissions }: ManagementUserEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Get the IDs of the user's current permissions
  const userPermissionIds = user.permissions.map(p => p.permission.id);

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      displayName: user.displayName,
      username: user.username,
      email: user.email ?? undefined, // Convert null to undefined
      role: user.role === "SUPER_ADMIN" ? "ADMIN" : user.role, // Don't allow editing to SUPER_ADMIN
      isActive: user.isActive,
      permissions: userPermissionIds,
    },
  });

  async function onSubmit(values: UserEditFormValues) {
    setIsSubmitting(true);
    try {
      await updateManagementUser(user.id, values);
      toast({
        title: "User updated",
        description: "The management user has been updated successfully.",
      });
    } catch (error: any) {
      debug.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Group permissions by category (based on prefix before underscore)
  const groupedPermissions = allPermissions.reduce((groups, permission) => {
    const category = permission.name.split('_')[0];
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, typeof allPermissions>);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                This is the user&apos;s public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The unique username used for login.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>
                The user&apos;s email address.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Determines what the user can access in the admin area.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Account Status</FormLabel>
                <FormDescription>
                  Activate or deactivate this user account.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Permissions</FormLabel>
          <FormDescription>
            Select the specific permissions this user should have.
          </FormDescription>

          <ScrollArea className="h-72 rounded-md border p-4">
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium capitalize">{category}</h4>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {permissions.map((permission) => (
                      <FormField
                        key={permission.id}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem
                            key={permission.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission.id)}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = checked
                                    ? [...(field.value ?? []), permission.id]
                                    : (field.value ?? []).filter((id) => id !== permission.id);
                                  field.onChange(updatedPermissions);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                {permission.name.split('_').slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </FormLabel>
                              {permission.description && (
                                <FormDescription className="text-xs">
                                  {permission.description}
                                </FormDescription>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}