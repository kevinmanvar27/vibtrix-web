import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "../../search/SearchResults";
import { Hash } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  return {
    title: `#${decodedTag} - Vibtrix`,
    description: `Posts tagged with #${decodedTag}`,
  };
}

export default async function HashtagPage({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const hashtag = `#${decodedTag}`;

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        {/* Hashtag Header */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{hashtag}</h1>
              <p className="text-sm text-muted-foreground">
                Posts tagged with {hashtag}
              </p>
            </div>
          </div>
        </div>

        {/* Posts with this hashtag */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Posts</h2>
          <div className="mt-4">
            <SearchResults query={hashtag} />
          </div>
        </div>

        {/* Related Hashtags */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Related Hashtags</h2>
          <div className="space-y-3">
            <Link
              href="/hashtag/competition"
              className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-primary">#competition</p>
              <p className="text-sm text-muted-foreground">Trending in competitions</p>
            </Link>
            <Link
              href="/hashtag/vibtrix"
              className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-primary">#vibtrix</p>
              <p className="text-sm text-muted-foreground">Trending in videos</p>
            </Link>
            <Link
              href="/hashtag/trending"
              className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-primary">#trending</p>
              <p className="text-sm text-muted-foreground">Popular posts</p>
            </Link>
          </div>
        </div>
      </div>
      <TrendsSidebar />
    </main>
  );
}
