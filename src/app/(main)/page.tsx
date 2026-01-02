import { validateRequest } from "@/auth";
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic imports with loading states
const PostEditorWrapper = dynamic(
  () => import("@/components/posts/editor/PostEditorWrapper"),
  { 
    loading: () => <div className="h-32 bg-card rounded-2xl animate-pulse" />,
    ssr: false 
  }
);

const GuestPostEditor = dynamic(
  () => import("@/components/posts/editor/GuestPostEditor"),
  { 
    loading: () => <div className="h-24 bg-card rounded-2xl animate-pulse" />,
    ssr: false 
  }
);

const TrendsSidebar = dynamic(
  () => import("@/components/TrendsSidebar"),
  { 
    loading: () => <div className="hidden lg:block w-80 h-96 bg-card rounded-2xl animate-pulse" />,
    ssr: false 
  }
);

const HomeTabs = dynamic(
  () => import("./HomeTabs"),
  { 
    loading: () => <div className="h-12 bg-card rounded-lg animate-pulse mb-4" />,
    ssr: false 
  }
);

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
