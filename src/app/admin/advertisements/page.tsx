import { redirect } from "next/navigation";
import { validateRequest } from "@/auth";

export const metadata = {
  title: "Advertisement Management",
};

export default async function AdvertisementsPage() {
  const { user } = await validateRequest();

  // Check if user has admin access
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/admin-login");
  }

  // Redirect to the list page
  redirect("/admin/advertisements/list");
}
