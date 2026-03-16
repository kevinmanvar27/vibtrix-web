import { validateRequest } from "@/auth";
import { Suspense, lazy } from "react";

// Lazy load components (proper way for Server Components in Next.js 15)
const PostEditorWrapper = lazy(() => import("@/components/posts/editor/PostEditorWrapper"));
const GuestPostEditor = lazy(() => import("@/components/posts/editor/GuestPostEditor"));
const TrendsSidebar = lazy(() => import("@/components/TrendsSidebar"));
const HomeTabs = lazy(() => import("./HomeTabs"));

export default async function Home() {
  const { user } = await validateRequest();
  const isLoggedIn = !!user;

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <Suspense fallback={<div className="h-32 bg-card rounded-2xl animate-pulse" />}>
          {isLoggedIn ? <PostEditorWrapper /> : <GuestPostEditor />}
        </Suspense>
        <Suspense fallback={<div className="h-12 bg-card rounded-lg animate-pulse mb-4" />}>
          <HomeTabs />
        </Suspense>
      </div>
      <Suspense fallback={<div className="hidden lg:block w-80 h-96 bg-card rounded-2xl animate-pulse" />}>
        <TrendsSidebar />
      </Suspense>
    </main>
  );
}
