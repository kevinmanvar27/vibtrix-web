"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import debug from "@/lib/debug";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    debug.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
        </div>

        {/* Error Text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Something Went Wrong</h1>
          <p className="text-muted-foreground mt-2">
            We're sorry, but we encountered an unexpected error.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded-md inline-block">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button onClick={() => reset()} size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" />
            Try Again
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
