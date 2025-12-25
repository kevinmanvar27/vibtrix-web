import { redirect } from "next/navigation";

export default function FirebaseSettingsRedirect() {
  redirect("/admin/settings?tab=firebase");
}
