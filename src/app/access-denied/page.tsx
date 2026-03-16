import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Access Denied",
};

export default async function AccessDeniedPage() {
  const { user } = await validateRequest();

  // If no user is logged in, redirect to login page
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            Your account does not have permission to access this application.
          </p>
          <p className="text-muted-foreground">
            Only users with the &apos;User&apos; role are allowed to log in through the frontend.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the administrator.
          </p>
          
          <form action={logout}>
            <Button type="submit" className="w-full">
              Log Out
            </Button>
          </form>
          
          {user.role === "ADMIN" || user.role === "MANAGER" || user.role === "SUPER_ADMIN" ? (
            <Link href="/admin" className="text-center text-sm text-primary hover:underline">
              Go to Admin Panel
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
