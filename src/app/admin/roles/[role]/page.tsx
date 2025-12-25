"use client";

import { useParams, useRouter } from "next/navigation";
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

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.role as string;

  const [role, setRole] = useState({
    id: "",
    name: "",
    description: "",
    isSystem: false,
  });

  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [error, setError] = useState("");
  const [isSeedingPermissions, setIsSeedingPermissions] = useState(false);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      try {
        // Fetch role details
        const roleResponse = await fetch(`/api/admin/roles/${roleId}`);
        if (!roleResponse.ok) {
          throw new Error("Failed to fetch role");
        }
        const roleData = await roleResponse.json();
        setRole(roleData);

        // Fetch permissions for this role
        const permissionsResponse = await fetch(`/api/admin/roles/${roleId}/permissions`);
        if (!permissionsResponse.ok) {
          throw new Error("Failed to fetch permissions");
        }
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions);
        setSelectedPermissions(permissionsData.assignedPermissionIds);

        // If no permissions found, offer to seed default permissions
        if (permissionsData.permissions.length === 0) {
          setError("No permissions found. Click 'Create Default Permissions' to add standard permissions.");
        }
      } catch (err) {
        debug.error("Error fetching data:", err);
        setError("Failed to load role data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [roleId]);

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
      const permissionsResponse = await fetch(`/api/admin/roles/${roleId}/permissions`);
      if (!permissionsResponse.ok) {
        throw new Error("Failed to fetch updated permissions");
      }
      const permissionsData = await permissionsResponse.json();
      setPermissions(permissionsData.permissions);
      setSelectedPermissions(permissionsData.assignedPermissionIds);
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

  const handleAddPermission = async () => {
    if (!newPermission.name) {
      toast.error("Permission name is required");
      return;
    }

    setIsAddingPermission(true);
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPermission),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create permission");
      }

      const newPermissionData = await response.json();

      // Add the new permission to the list and select it
      setPermissions([...permissions, newPermissionData]);
      setSelectedPermissions([...selectedPermissions, newPermissionData.id]);

      // Reset the form
      setNewPermission({ name: "", description: "" });

      toast.success("Permission created successfully");
    } catch (err: any) {
      debug.error("Error creating permission:", err);
      toast.error(err.message || "Failed to create permission");
    } finally {
      setIsAddingPermission(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Update role details
      const roleResponse = await fetch(`/api/admin/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: role.name,
          description: role.description,
        }),
      });

      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      // Update role permissions
      const permissionsResponse = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permissionIds: selectedPermissions,
        }),
      });

      if (!permissionsResponse.ok) {
        const errorData = await permissionsResponse.json();
        throw new Error(errorData.error || "Failed to update permissions");
      }

      toast.success("Role and permissions updated successfully");

      // Redirect back to roles list
      router.push("/admin/roles");
    } catch (err: any) {
      debug.error("Error updating role:", err);
      setError(err.message || "Failed to update role. Please try again.");
      toast.error(err.message || "Failed to update role");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error && permissions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button asChild variant="ghost" className="mr-2">
            <Link href="/admin/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center justify-between">
              <div>{error}</div>
              <Button
                onClick={handleSeedPermissions}
                disabled={isSeedingPermissions}
                className="mt-2 sm:mt-0"
              >
                {isSeedingPermissions ? "Creating..." : "Create Default Permissions"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Role</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Combined Role Information and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Role</CardTitle>
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
                    disabled={role.isSystem}
                    required
                  />
                  {role.isSystem && (
                    <p className="text-sm text-muted-foreground">
                      System role names cannot be changed.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={role.description || ""}
                    onChange={(e) => setRole({ ...role, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t my-6"></div>

              {/* Create New Permission Section */}
              {!role.isSystem && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Create New Permission</h3>
                  <div className="grid gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="permissionName">Permission Name</Label>
                      <Input
                        id="permissionName"
                        value={newPermission.name}
                        onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                        placeholder="Enter permission name (e.g., view_users, edit_posts)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="permissionDescription">Description</Label>
                      <Input
                        id="permissionDescription"
                        value={newPermission.description}
                        onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                        placeholder="Describe what this permission allows"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddPermission}
                      disabled={isAddingPermission || !newPermission.name}
                      className="w-full md:w-auto md:self-end"
                    >
                      {isAddingPermission ? "Adding..." : "Add Permission"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Divider */}
              {!role.isSystem && <div className="border-t my-6"></div>}

              {/* Permissions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Assign Permissions</h3>
                {permissions.length === 0 ? (
                  <p className="text-muted-foreground">No permissions found. {!role.isSystem && "Create a permission using the form above."}</p>
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
                                  disabled={role.isSystem && role.name === "SUPER_ADMIN"}
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
                                  disabled={role.isSystem && role.name === "SUPER_ADMIN"}
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
                                  disabled={role.isSystem && role.name === "SUPER_ADMIN"}
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
                                  disabled={role.isSystem && role.name === "SUPER_ADMIN"}
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
                                    disabled={role.isSystem && role.name === "SUPER_ADMIN"}
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

                {role.isSystem && role.name === "SUPER_ADMIN" && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Super Admin role has all permissions by default and cannot be modified.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || (role.isSystem && role.name === "SUPER_ADMIN")}
          >
            {isSaving ? "Saving..." : "Save Changes"}
            {!isSaving && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
