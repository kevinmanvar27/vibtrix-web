import { lazyLoad } from "@/lib/lazyLoad";
import { validateRequest } from "@/auth";

// Lazy load components that aren't needed immediately
const PostEditorWrapper = lazyLoad(() => import("@/components/posts/editor/PostEditorWrapper"));
const GuestPostEditor = lazyLoad(() => import("@/components/posts/editor/GuestPostEditor"));
const TrendsSidebar = lazyLoad(() => import("@/components/TrendsSidebar"));
const HomeTabs = lazyLoad(() => import("./HomeTabs"));

export default async function Home() {
  // Check if user is logged in
  const { user } = await validateRequest();
  const isLoggedIn = !!user;

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        {isLoggedIn ? <PostEditorWrapper /> : <GuestPostEditor />}
        <HomeTabs />
      </div>
      {/* TrendsSidebar is already hidden on mobile with its own className */}
      <TrendsSidebar />
    </main>
  );
}
