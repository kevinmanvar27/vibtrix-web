"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "@/lib/toast";


import debug from "@/lib/debug";

type Permission = {
  id: string;
  name: string;
  description: string | null;
};

type ModulePermissions = {
  module: string;
  permissions: {
    view?: Permission;
    create?: Permission;
    edit?: Permission;
    delete?: Permission;
  };
};

export default function NewRolePage() {
  const router = useRouter();

  const [role, setRole] = useState({
    name: "",
    description: "",
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [isSeedingPermissions, setIsSeedingPermissions] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // Fetch all available permissions
        const response = await fetch('/api/admin/permissions');
        if (!response.ok) {
          throw new Error("Failed to fetch permissions");
        }
        const data = await response.json();
        setPermissions(data);

        // If no permissions found, offer to seed default permissions
        if (data.length === 0) {
          setError("No permissions found. Click 'Create Default Permissions' to add standard permissions.");
        }
      } catch (err) {
        debug.error("Error fetching permissions:", err);
        setError("Failed to load permissions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handleSeedPermissions = async () => {
    setIsSeedingPermissions(true);
    try {
      const response = await fetch('/api/admin/permissions/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create default permissions");
      }

      const result = await response.json();
      toast.success(`${result.count} default permissions created successfully`);

      // Refresh permissions list
      const permissionsResponse = await fetch('/api/admin/permissions');
      if (!permissionsResponse.ok) {
        throw new Error("Failed to fetch updated permissions");
      }
      const updatedPermissions = await permissionsResponse.json();
      setPermissions(updatedPermissions);
      setError(""); // Clear any error message
    } catch (err: any) {
      debug.error("Error creating default permissions:", err);
      toast.error(err.message || "Failed to create default permissions");
    } finally {
      setIsSeedingPermissions(false);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(id => id !== permissionId));
    }
  };

  // Function to organize permissions by module
  const getModulePermissions = (): ModulePermissions[] => {
    // Define modules we want to display
    const modules = [
      'users', 'posts', 'competitions', 'pages', 'settings', 'roles', 'permissions', 'stickers', 'payments'
    ];

    // Initialize module permissions
    const modulePermissions: { [key: string]: ModulePermissions } = {};
    modules.forEach(module => {
      modulePermissions[module] = {
        module: module.charAt(0).toUpperCase() + module.slice(1),
        permissions: {}
      };
    });

    // Add "Other" category for uncategorized permissions
    modulePermissions['other'] = {
      module: 'Other',
      permissions: {}
    };

    // Track which permissions have been categorized
    const categorizedPermissionIds = new Set<string>();

    // Categorize permissions
    permissions.forEach(permission => {
      const name = permission.name.toLowerCase();

      // Find which moduleType this permission belongs to
      const moduleType = modules.find(m => name.includes(m));

      if (moduleType) {
        // Determine the action (view, create, edit, delete)
        if (name.includes('view') || name.includes('read') || name.includes('list')) {
          modulePermissions[moduleType].permissions.view = permission;
          categorizedPermissionIds.add(permission.id);
        } else if (name.includes('create') || name.includes('add')) {
          modulePermissions[moduleType].permissions.create = permission;
          categorizedPermissionIds.add(permission.id);
        } else if (name.includes('edit') || name.includes('update') || name.includes('modify')) {
          modulePermissions[moduleType].permissions.edit = permission;
          categorizedPermissionIds.add(permission.id);
        } else if (name.includes('delete') || name.includes('remove')) {
          modulePermissions[moduleType].permissions.delete = permission;
          categorizedPermissionIds.add(permission.id);
        }
      }
    });

    // Get uncategorized permissions
    const uncategorizedPermissions = permissions.filter(p => !categorizedPermissionIds.has(p.id));

    // Add uncategorized permissions to a special "Other" section
    if (uncategorizedPermissions.length > 0) {
      // We'll just add these to a special array to handle separately in the UI
      modulePermissions['uncategorized'] = {
        module: 'Uncategorized',
        permissions: {}
      };
    }

    // Filter out empty modules and sort alphabetically
    const result = Object.values(modulePermissions)
      .filter(mp => mp.module !== 'Uncategorized' &&
                   (Object.keys(mp.permissions).length > 0 || mp.module === 'Other'))
      .sort((a, b) => a.module.localeCompare(b.module));

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Create the role
      const roleResponse = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(role),
      });

      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        throw new Error(errorData.error || "Failed to create role");
      }

      const newRole = await roleResponse.json();

      // Assign permissions to the new role
      if (selectedPermissions.length > 0) {
        const permissionsResponse = await fetch(`/api/admin/roles/${newRole.id}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissionIds: selectedPermissions,
          }),
        });

        if (!permissionsResponse.ok) {
          const errorData = await permissionsResponse.json();
          throw new Error(errorData.error || "Failed to assign permissions");
        }
      }

      toast.success("Role created successfully");

      // Redirect back to roles list
      router.push("/admin/roles");
    } catch (err: any) {
      debug.error("Error creating role:", err);
      setError(err.message || "Failed to create role. Please try again.");
      toast.error(err.message || "Failed to create role");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button asChild variant="ghost" className="mr-2">
            <Link href="/admin/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create New Role</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center justify-between">
          <div>{error}</div>
          {permissions.length === 0 && (
            <Button
              onClick={handleSeedPermissions}
              disabled={isSeedingPermissions}
              className="mt-2 sm:mt-0"
            >
              {isSeedingPermissions ? "Creating..." : "Create Default Permissions"}
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Combined Role Information and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Role Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Role Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={role.name}
                    onChange={(e) => setRole({ ...role, name: e.target.value })}
                    placeholder="Enter role name"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Role name should be unique and descriptive.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={role.description}
                    onChange={(e) => setRole({ ...role, description: e.target.value })}
                    placeholder="Describe the purpose and permissions of this role"
                    rows={3}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t my-6"></div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Assign Permissions</h3>
                {permissions.length === 0 ? (
                  <p className="text-muted-foreground">No permissions found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Module Name</TableHead>
                          <TableHead className="text-center">View</TableHead>
                          <TableHead className="text-center">Create</TableHead>
                          <TableHead className="text-center">Edit</TableHead>
                          <TableHead className="text-center">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getModulePermissions().map((module) => (
                          <TableRow key={module.module}>
                            <TableCell className="font-medium">{module.module}</TableCell>
                            <TableCell className="text-center">
                              {module.permissions.view && (
                                <Checkbox
                                  id={`permission-${module.permissions.view.id}`}
                                  checked={selectedPermissions.includes(module.permissions.view.id)}
                                  onCheckedChange={(checked) =>
                                    module.permissions.view && 
                                    handlePermissionChange(module.permissions.view.id, checked === true)
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {module.permissions.create && (
                                <Checkbox
                                  id={`permission-${module.permissions.create.id}`}
                                  checked={selectedPermissions.includes(module.permissions.create.id)}
                                  onCheckedChange={(checked) =>
                                    module.permissions.create && 
                                    handlePermissionChange(module.permissions.create.id, checked === true)
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {module.permissions.edit && (
                                <Checkbox
                                  id={`permission-${module.permissions.edit.id}`}
                                  checked={selectedPermissions.includes(module.permissions.edit.id)}
                                  onCheckedChange={(checked) =>
                                    module.permissions.edit && 
                                    handlePermissionChange(module.permissions.edit.id, checked === true)
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {module.permissions.delete && (
                                <Checkbox
                                  id={`permission-${module.permissions.delete.id}`}
                                  checked={selectedPermissions.includes(module.permissions.delete.id)}
                                  onCheckedChange={(checked) =>
                                    module.permissions.delete && 
                                    handlePermissionChange(module.permissions.delete.id, checked === true)
                                  }
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Display uncategorized permissions */}
                        {permissions.filter(p => !getModulePermissions().some(mp =>
                          Object.values(mp.permissions).some(perm => perm && perm.id === p.id)
                        )).length > 0 && (
                          <>
                            <TableRow className="bg-muted/50">
                              <TableCell colSpan={5} className="font-medium">Other Permissions</TableCell>
                            </TableRow>
                            {permissions.filter(p => !getModulePermissions().some(mp =>
                              Object.values(mp.permissions).some(perm => perm && perm.id === p.id)
                            )).map(permission => (
                              <TableRow key={permission.id}>
                                <TableCell className="pl-6">{permission.name}</TableCell>
                                <TableCell colSpan={4} className="text-center">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={selectedPermissions.includes(permission.id)}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(permission.id, checked === true)
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating..." : "Create Role"}
            {!isSaving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
