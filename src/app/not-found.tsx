"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Logo or Site Name */}
        <div className="flex justify-center items-center">
          <span className="text-3xl font-bold text-primary">Vibtrix</span>
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-extrabold text-primary">404</h1>
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground mt-2">
            We couldn't find the page you were looking for.
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
          <Button variant="outline" size="lg" className="gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
