import { validateRequest } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Lock, Shield, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account Settings",
};

export default async function AccountPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your profile information and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Username</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Display Name</span>
                <span className="font-medium">{user.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-medium">{user.email || "Not set"}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <Button asChild className="w-full">
              <Link href="/profile/edit">
                Edit Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security and login activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/account/login-activity">
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Login Activity
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
