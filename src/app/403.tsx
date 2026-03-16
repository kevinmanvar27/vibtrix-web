"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForbiddenError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 p-6">
            <ShieldAlert className="h-16 w-16 text-amber-600" />
          </div>
        </div>

        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-extrabold text-amber-600">403</h1>
          <h2 className="text-3xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-5 w-5" />
              Return Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
