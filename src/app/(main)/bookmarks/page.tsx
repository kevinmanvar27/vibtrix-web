import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import Bookmarks from "./Bookmarks";
import { getFeatureSettings } from "@/lib/get-feature-settings";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default async function Page() {
  // Check if bookmarks feature is enabled
  const { bookmarksEnabled } = await getFeatureSettings();

  // Redirect to home page if bookmarks feature is disabled
  if (!bookmarksEnabled) {
    return redirect('/');
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Bookmarks</h1>
        </div>
        <Bookmarks />
      </div>
      <TrendsSidebar />
    </main>
  );
}
