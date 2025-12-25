"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import debug from "@/lib/debug";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    debug.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
          <div className="mx-auto max-w-md text-center space-y-8">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Error Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Critical Error</h1>
              <p className="text-muted-foreground mt-2">
                A critical error has occurred. We're working on fixing it.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-4 p-2 bg-muted rounded-md inline-block">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <Button onClick={() => reset()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8 text-sm font-medium">
                <RotateCcw className="h-5 w-5" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = "/"} 
                className="gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8 text-sm font-medium"
              >
                <Home className="h-5 w-5" />
                Return Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
