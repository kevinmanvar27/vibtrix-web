"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

import debug from "@/lib/debug";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionTitle: string;
  onPaymentSuccess: () => void;
}

export default function MockPaymentModal({
  isOpen,
  onClose,
  competitionId,
  competitionTitle,
  onPaymentSuccess,
}: MockPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed">("pending");
  const { toast } = useToast();

  const handleMockPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create a mock payment ID
      const mockPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Call the verify endpoint with mock data
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId: mockPaymentId,
          orderId: `order_mock_${Date.now()}`,
          signature: "mock_signature_for_testing",
          competitionId,
          isMockPayment: true, // Flag to indicate this is a mock payment
        }),
      });

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(data.error || "Mock payment verification failed");
      }

      setPaymentStatus("success");
      toast({
        title: "Test Payment Successful",
        description: "Your test payment has been processed successfully.",
      });
      onPaymentSuccess();
    } catch (error) {
      debug.error("Error processing mock payment:", error);
      setPaymentStatus("failed");
      setError(error instanceof Error ? error.message : "Mock payment failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (paymentStatus === "success") {
      onPaymentSuccess();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Payment</DialogTitle>
          <DialogDescription>
            Complete test payment to join {competitionTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Processing test payment...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleMockPayment}
              >
                Try Again
              </Button>
            </div>
          ) : paymentStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-xl font-semibold">Test Payment Successful!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have successfully joined the competition.
              </p>
              <Button className="mt-4" onClick={handleClose}>
                Continue
              </Button>
            </div>
          ) : (
            <>
              <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This is a test payment. No actual payment will be processed.
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <p className="font-medium">
                  Amount: ₹{competitionId ? "100.00" : "0.00"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Test Mode
                </p>
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  onClick={handleMockPayment}
                  className="w-full"
                >
                  Complete Test Payment
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
