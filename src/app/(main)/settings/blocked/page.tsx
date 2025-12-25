import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { Ban, ShieldOff } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import BlockedUsersClient from "./BlockedUsersClient";
import { getFeatureSettings } from "@/lib/get-feature-settings";

export const metadata = {
  title: "Blocked Users",
};

export default async function BlockedUsersPage() {
  const { user } = await validateRequest();
  const { userBlockingEnabled } = await getFeatureSettings();

  if (!user) {
    return notFound();
  }

  // Redirect to settings page if user blocking is disabled
  if (!userBlockingEnabled) {
    return redirect('/settings');
  }

  // Get all users that the current user has blocked
  const blockedUsers = await prisma.userBlock.findMany({
    where: {
      blockerId: user.id,
    },
    include: {
      blocked: {
        select: getUserDataSelect(user.id),
      },
    },
  });

  // Extract just the user data from the results
  const users = blockedUsers.map((block) => block.blocked);

  return (
    <main className="w-full">
      <BlockedUsersClient users={users} />
    </main>
  );
}
