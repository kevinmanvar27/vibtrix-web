import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { FeatureSettingsProvider } from "@/components/FeatureSettingsProvider";
import { getFeatureSettings } from "@/lib/get-feature-settings";
import AdminSidebarWrapper from "./components/AdminSidebarWrapper";

import debug from "@/lib/debug";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Check if this is the login page by examining the children's segment
    // This is a workaround since we can't directly access the current path in a layout component
    const isLoginPage =
      (children as any)?.props?.childProp?.segment === "login" ||
      (children as any)?.props?.segment === "login";

    // If this is the login page, render without authentication check
    if (isLoginPage) {
      return children;
    }

    // For all other admin pages, verify admin access
    const { user } = await validateRequest();

    // Check if user has admin access
    const hasAdminAccess = user && (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "SUPER_ADMIN"
    );

    // If no admin access, redirect to login
    if (!hasAdminAccess) {
      return redirect("/admin-login");
    }

    // Fetch feature settings
    const featureSettings = await getFeatureSettings();

    // Render the layout with the sidebar
    // The middleware will ensure only authenticated users with admin access reach this point
    return (
      <FeatureSettingsProvider settings={featureSettings}>
        <div className="flex min-h-screen">
          {user && <AdminSidebarWrapper user={user} />}
          <div className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </FeatureSettingsProvider>
    );
  } catch (error) {
    // If there's an error, redirect to the admin login page
    debug.error("Error in admin layout:", error);
    return redirect("/admin-login");
  }
}
