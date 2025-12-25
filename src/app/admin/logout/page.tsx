import { adminLogout } from "../actions";
import { redirect } from "next/navigation";

import debug from "@/lib/debug";

export default async function AdminLogoutPage() {
  try {
    // Attempt to logout
    await adminLogout();
  } catch (error) {
    debug.error("Error during logout:", error);
    // Continue to redirect even if there's an error
  }

  // Always redirect to admin-login page
  redirect("/admin-login");

  // This is just a fallback, the redirect above should handle it
  return null;
}
