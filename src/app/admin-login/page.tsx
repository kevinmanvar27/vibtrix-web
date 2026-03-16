import { Metadata } from "next";
import { validateRequest } from "@/auth";
// Remove server-side redirect
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Debug client removed
import AdminLoginClientForm from "./AdminLoginClientForm";
import RedirectIfLoggedIn from "./RedirectIfLoggedIn";

import debug from "@/lib/debug";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  // Check if user is already logged in and is an admin
  let isLoggedIn = false;
  let isAdmin = false;

  try {
    const { user } = await validateRequest();
    isLoggedIn = !!user;
    isAdmin = !!user?.isAdmin;

    debug.log("Admin login page - User status:", { isLoggedIn, isAdmin });
  } catch (error) {
    debug.error("Error validating request:", error);
    // Continue rendering the login page even if validation fails
  }

  return (
    <div className="flex h-screen items-center justify-center p-4 bg-muted/40">
      <RedirectIfLoggedIn
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        redirectTo="/admin/dashboard"
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginClientForm />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" asChild>
            <a href="/">Back to site</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
