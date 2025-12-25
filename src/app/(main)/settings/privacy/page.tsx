import { validateRequest } from "@/auth";
import { Eye } from "lucide-react";
import { notFound } from "next/navigation";
import PrivacySettingsClient from "./PrivacySettingsClient";

export const metadata = {
  title: "Privacy Settings",
};

export default async function PrivacySettingsPage() {
  const { user } = await validateRequest();

  if (!user) {
    return notFound();
  }

  return (
    <main className="w-full">
      <PrivacySettingsClient
        showOnlineStatus={user.showOnlineStatus}
        isProfilePublic={user.isProfilePublic}
        showWhatsappNumber={user.showWhatsappNumber}
        showDob={user.showDob}
        hideYear={(user as any).hideYear}
      />
    </main>
  );
}
