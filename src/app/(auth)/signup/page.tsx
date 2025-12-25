import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SignUpForm from "./SignUpForm";
import { getSiteSettings } from "./getSiteSettings";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default async function Page() {
  const settings = await getSiteSettings();
  return (
    <main className="flex h-screen items-center justify-center p-5">
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-2 text-center">
            {settings.logoUrl ? (
              <div className="flex justify-center">
                <div className="relative overflow-hidden" style={{ height: `60px`, width: `300px` }}>
                  <Image
                    src={settings.logoUrl}
                    alt="Vibtrix Logo"
                    width={300}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>
            ) : (
              <h1 className="text-3xl font-bold">Vibtrix</h1>
            )}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Create your account</h2>
              <p className="text-muted-foreground">
                A place where even <span className="italic">you</span> can find a
                friend.
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <SignUpForm />
            <Link href="/login" className="block text-center hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </div>
        <div className="hidden w-1/2 bg-primary/10 md:block" />
      </div>
    </main>
  );
}
