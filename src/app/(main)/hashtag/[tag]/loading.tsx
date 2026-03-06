import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";

export default function Loading() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        {/* Hashtag Header Skeleton */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-32 animate-pulse rounded bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Posts Skeleton */}
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="h-6 w-24 animate-pulse rounded bg-muted mb-5" />
          <PostsLoadingSkeleton />
        </div>
      </div>
      
      {/* Sidebar Skeleton */}
      <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="h-6 w-32 animate-pulse rounded bg-muted mb-4" />
          <div className="space-y-3">
            <div className="h-16 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}
