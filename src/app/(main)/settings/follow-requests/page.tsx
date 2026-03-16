import { validateRequest } from "@/auth";
import { UserPlus } from "lucide-react";
import { notFound } from "next/navigation";
import FollowRequestsClient from "./FollowRequestsClient";

export const metadata = {
  title: "Follow Requests",
};

export default async function FollowRequestsPage() {
  const { user } = await validateRequest();

  if (!user) {
    return notFound();
  }

  return (
    <main className="w-full">
      <FollowRequestsClient />
    </main>
  );
}
