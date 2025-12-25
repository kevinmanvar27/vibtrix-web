import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSiteSettings } from "./getSiteSettings";

// Use dynamic imports with no SSR to avoid server/client mismatch
const GoogleSignInButton = dynamic(() => import("./google/GoogleSignInButton"), {
  ssr: false,
});

const LoginForm = dynamic(() => import("./LoginForm"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Login",
};

export default async function Page() {
  // Get site settings to determine which login methods to display
  const settings = await getSiteSettings();
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="flex flex-col items-center gap-2">
            {settings.logoUrl ? (
              <div className="relative overflow-hidden" style={{ height: `60px`, width: `300px` }}>
                <Image
                  src={settings.logoUrl}
                  alt="Vibtrix Logo"
                  width={300}
                  height={60}
                  className="object-contain"
                />
              </div>
            ) : (
              <h1 className="text-center text-3xl font-bold">Vibtrix</h1>
            )}
            <h2 className="text-center text-xl">Login to your account</h2>
          </div>
          <div className="space-y-5">
            {settings.googleLoginEnabled && <GoogleSignInButton />}

            {settings.googleLoginEnabled && settings.manualSignupEnabled && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-muted" />
                <span>OR</span>
                <div className="h-px flex-1 bg-muted" />
              </div>
            )}

            {settings.manualSignupEnabled && <LoginForm />}

            {settings.manualSignupEnabled && (
              <Link href="/signup" className="block text-center hover:underline">
                Don&apos;t have an account? Sign up
              </Link>
            )}
          </div>
        </div>
        <div className="hidden w-1/2 bg-primary/10 md:block" />
      </div>
    </main>
  );
}
