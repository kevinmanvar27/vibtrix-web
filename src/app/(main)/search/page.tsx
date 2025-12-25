import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import UserSearchResults from "./UserSearchResults";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface PageProps {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: searchParams.q ? `Search results for "${searchParams.q}"` : "Search",
  };
}

export default function Page({ searchParams }: PageProps) {
  const q = searchParams.q || "";
  // Check if the search query is a hashtag search
  const isHashtagSearch = q.startsWith('#');

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <form method="GET" action="/search" className="w-full">
            <div className="relative w-full">
              <Input
                name="q"
                placeholder="Search users or posts..."
                className="pe-10 w-full h-10"
                defaultValue={q}
                autoFocus
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="size-5 text-muted-foreground" />
              </button>
            </div>
          </form>
        </div>

        {q ? (
          <>
            {/* Only show People section for non-hashtag searches */}
            {!isHashtagSearch && (
              <div className="rounded-2xl bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-bold">People</h2>
                <UserSearchResults query={q} />
              </div>
            )}

            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h2 className="mb-5 text-xl font-bold">Posts</h2>
              <div className="mt-4">
                <SearchResults query={q} />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Trending Hashtags</h2>
            <div className="space-y-3">
              <Link
                href="/search?q=%23competition"
                className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-primary">#competition</p>
                <p className="text-sm text-muted-foreground">Trending in competitions</p>
              </Link>
              <Link
                href="/search?q=%23vibtrix"
                className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-primary">#vibtrix</p>
                <p className="text-sm text-muted-foreground">Trending in videos</p>
              </Link>
              <Link
                href="/search?q=%23trending"
                className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-primary">#trending</p>
                <p className="text-sm text-muted-foreground">Popular posts</p>
              </Link>
            </div>
          </div>
        )}
      </div>
      <TrendsSidebar />
    </main>
  );
}
