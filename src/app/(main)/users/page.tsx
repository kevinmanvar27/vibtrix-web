import { Metadata } from "next";
import TrendsSidebar from "@/components/TrendsSidebar";
import UserListingClient from "./UserListingClient";

export const metadata: Metadata = {
  title: "Users - Vibtrix",
  description: "Browse and discover users on Vibtrix",
};

interface PageProps {
  searchParams: {
    page?: string;
    onlineStatus?: string;
    gender?: string;
  };
}

export default function UsersPage({ searchParams }: PageProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const onlineStatus = searchParams.onlineStatus || "";
  const gender = searchParams.gender || "";

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Users</h1>
          <p className="text-center text-muted-foreground mt-2">
            Discover and connect with other users
          </p>
        </div>

        <UserListingClient
          initialPage={page}
          initialOnlineStatus={onlineStatus}
          initialGender={gender}
        />
      </div>
      <TrendsSidebar />
    </main>
  );
}
