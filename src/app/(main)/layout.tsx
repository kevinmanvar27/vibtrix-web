import { validateRequest } from "@/auth";
import MenuBar from "./MenuBar";
import Navbar from "./Navbar";
import OnlineStatusProvider from "./OnlineStatusProvider";
import SessionProvider from "./SessionProvider";
import AdminImpersonationCheck from "./AdminImpersonationCheck";
import MediaProtection from "@/components/MediaProtection";
import { FeatureSettingsProvider } from "@/components/FeatureSettingsProvider";
import { getFeatureSettings } from "@/lib/get-feature-settings";
import GuestSessionProvider from "@/components/GuestSessionProvider";
import Footer from "@/components/Footer";
import { seedStaticPages } from "@/lib/seed-static-pages";
import MobileNavBarWrapper from "@/components/MobileNavBarWrapper";
import { Suspense } from "react";

// Loading skeleton for MenuBar
function MenuBarSkeleton() {
  return (
    <div className="sticky top-[4.5rem] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80 animate-pulse">
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
    </div>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Run all async operations in parallel for faster initial load
  const [session, featureSettings] = await Promise.all([
    validateRequest(),
    getFeatureSettings(),
  ]);

  // Seed static pages in background - don't block render
  seedStaticPages().catch(() => {});

  const isLoggedIn = !!session.user;

  const MainContent = (
    <div className="relative min-h-screen">
      <div className="flex min-h-screen flex-col pb-14 sm:pb-0">
        <Suspense fallback={<div className="h-16 bg-card shadow-sm border-b border-border/30" />}>
          <Navbar />
        </Suspense>
        <div className="mx-auto flex w-full max-w-7xl grow gap-3 sm:gap-5 p-3 pt-4 sm:p-5 mt-1 pb-20 sm:pb-5">
          <Suspense fallback={<MenuBarSkeleton />}>
            <MenuBar className="sticky top-[4.5rem] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80" />
          </Suspense>
          <div className="w-full min-w-0">
            {children}
          </div>
        </div>
        <Footer />
        {isLoggedIn && <AdminImpersonationCheck />}
        <MediaProtection />
      </div>
      {/* Mobile navigation - only visible on mobile screens */}
      <div className="mobile-nav-wrapper fixed bottom-0 left-0 right-0 z-[999999] w-full md:hidden sm:hidden">
        <MobileNavBarWrapper />
      </div>
    </div>
  );

  return isLoggedIn ? (
    <SessionProvider value={{ ...session, isLoggedIn: true }}>
      <FeatureSettingsProvider settings={featureSettings}>
        <OnlineStatusProvider>
          {MainContent}
        </OnlineStatusProvider>
      </FeatureSettingsProvider>
    </SessionProvider>
  ) : (
    <SessionProvider value={{ user: null, session: null, isLoggedIn: false }}>
      <GuestSessionProvider>
        <FeatureSettingsProvider settings={featureSettings}>
          {MainContent}
        </FeatureSettingsProvider>
      </GuestSessionProvider>
    </SessionProvider>
  );
}
