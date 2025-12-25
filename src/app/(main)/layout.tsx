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

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateRequest();
  const featureSettings = await getFeatureSettings();

  // Seed static pages if they don't exist
  await seedStaticPages();

  // Allow non-logged-in users to access all pages
  const isLoggedIn = !!session.user;

  return isLoggedIn ? (
    // Logged-in user experience with full session
    <SessionProvider value={{ ...session, isLoggedIn: true }}>
      <FeatureSettingsProvider settings={featureSettings}>
        <OnlineStatusProvider>
          <div className="relative min-h-screen">
            <div className="flex min-h-screen flex-col pb-14 sm:pb-0">
              <Navbar />
              <div className="mx-auto flex w-full max-w-7xl grow gap-3 sm:gap-5 p-3 pt-4 sm:p-5 mt-1 pb-20 sm:pb-5">
                <MenuBar className="sticky top-[4.5rem] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80" />
                <div className="w-full min-w-0">
                  {children}
                </div>
              </div>
              <Footer />
              <AdminImpersonationCheck />
              <MediaProtection />
            </div>
            {/* Mobile navigation - only visible on mobile screens */}
            <div className="mobile-nav-wrapper fixed bottom-0 left-0 right-0 z-[999999] w-full md:hidden sm:hidden">
              <MobileNavBarWrapper key={`mobile-nav-${Date.now()}`} />
            </div>
          </div>
        </OnlineStatusProvider>
      </FeatureSettingsProvider>
    </SessionProvider>
  ) : (
    // Guest user experience with limited functionality
    <SessionProvider value={{ user: null, session: null, isLoggedIn: false }}>
      <GuestSessionProvider>
        <FeatureSettingsProvider settings={featureSettings}>
          <div className="relative min-h-screen">
            <div className="flex min-h-screen flex-col pb-14 sm:pb-0">
              <Navbar />
              <div className="mx-auto flex w-full max-w-7xl grow gap-3 sm:gap-5 p-3 pt-4 sm:p-5 mt-1 pb-20 sm:pb-5">
                <MenuBar className="sticky top-[4.5rem] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80" />
                <div className="w-full min-w-0">
                  {children}
                </div>
              </div>
              <Footer />
              <MediaProtection />
            </div>
            {/* Mobile navigation - only visible on mobile screens */}
            <div className="mobile-nav-wrapper fixed bottom-0 left-0 right-0 z-[999999] w-full md:hidden sm:hidden">
              <MobileNavBarWrapper key={`mobile-nav-guest-${Date.now()}`} />
            </div>
          </div>
        </FeatureSettingsProvider>
      </GuestSessionProvider>
    </SessionProvider>
  );
}
