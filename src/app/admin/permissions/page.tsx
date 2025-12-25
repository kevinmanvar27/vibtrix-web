import { redirect } from "next/navigation";

export default function PermissionsPage() {
  // Redirect to roles page
  redirect("/admin/roles");
}
