"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function RazorpayStatusAlert() {
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const checkRazorpayStatus = async () => {
      try {
        const response = await fetch("/api/admin/settings/razorpay-status");
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Failed to check Razorpay status");
          return;
        }

        if (!data.isConfigured) {
          setStatus("error");
          setErrorMessage(data.message || "Razorpay is not properly configured");

          // Add more detailed information based on the error message
          if (data.message.includes("API keys are missing")) {
            setErrorDetails("You need to add your Razorpay API keys in the settings.");
          } else if (data.message.includes("disabled")) {
            setErrorDetails("Razorpay is currently disabled. Enable it in the payment settings.");
          } else if (data.message.includes("not found")) {
            setErrorDetails("The site settings record is missing. Try restarting the server or contact support.");
          } else {
            setErrorDetails("Check your Razorpay configuration in the payment settings tab.");
          }

          return;
        }

        setStatus("success");
      } catch (error) {
        setStatus("error");
        setErrorMessage("Failed to check Razorpay status");
      }
    };

    checkRazorpayStatus();
  }, []);

  if (status === "loading") {
    return null;
  }

  if (status === "success") {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment System Issue</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p className="font-medium">{errorMessage}</p>
        {errorDetails && (
          <p className="text-sm mt-1">{errorDetails}</p>
        )}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => router.push("/admin/settings?tab=payment")}
          >
            Configure Razorpay
          </Button>
          <Button
            variant="link"
            size="sm"
            className="text-xs ml-2"
            onClick={() => window.open("https://dashboard.razorpay.com", "_blank")}
          >
            Open Razorpay Dashboard
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
