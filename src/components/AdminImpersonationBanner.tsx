"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import debug from "@/lib/debug";

export default function AdminImpersonationBanner() {
  const [isReturning, setIsReturning] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleReturnToAdmin = async () => {
    try {
      setIsReturning(true);
      const response = await fetch("/api/admin/return-to-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to return to admin account");
      }

      toast({
        title: "Success",
        description: data.message,
      });

      // Redirect to admin dashboard
      router.push(data.redirectTo || "/admin/dashboard");
    } catch (error) {
      debug.error("Error returning to admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to return to admin account",
      });
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 fixed bottom-4 right-4 z-50 shadow-lg rounded-md max-w-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700 font-medium">
            You are currently logged in as a user (Admin Mode)
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturnToAdmin}
              disabled={isReturning}
              className="bg-white hover:bg-yellow-50 text-yellow-800 border-yellow-300"
            >
              {isReturning ? "Returning..." : "Return to Admin Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
