"use client";

import { Button } from "@/components/ui/button";
import { ServerCrash, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function ServerError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ServerCrash className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-extrabold text-destructive">500</h1>
          <h2 className="text-3xl font-bold">Server Error</h2>
          <p className="text-muted-foreground mt-2">
            Our server encountered an error and couldn't complete your request.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button onClick={() => window.location.reload()} size="lg" className="gap-2">
            <RefreshCw className="h-5 w-5" />
            Refresh Page
          </Button>
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link href="/">
              <Home className="h-5 w-5" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
