"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Loader2, Upload, Eye, CreditCard } from "lucide-react";

import { useSession } from "@/app/(main)/SessionProvider";

import debug from "@/lib/debug";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ParticipateButtonProps {
  competitionId: string;
  isParticipant: boolean;
  competitionTitle: string;
  isActive: boolean;
  firstRoundCompleted?: boolean;
  hasPaid?: boolean;
  isPaid?: boolean;
  entryFee?: number | null;
}

export function ParticipateButton({
  competitionId,
  isParticipant,
  competitionTitle = "Competition",
  isActive,
  firstRoundCompleted = false,
  hasPaid = false,
  isPaid = false,
  entryFee = null
}: ParticipateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [lastPaymentAttempt, setLastPaymentAttempt] = useState<number | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoggedIn } = useSession();

  // Load Razorpay script when needed
  const loadRazorpayScript = () => {
    // Check if script is already loaded
    if (window.Razorpay) {
      debug.log("Razorpay already loaded");
      setIsRazorpayLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      debug.log("Razorpay script is already loading");
      existingScript.addEventListener('load', () => {
        debug.log("Existing Razorpay script loaded");
        setIsRazorpayLoaded(true);
      });
      existingScript.addEventListener('error', (e) => {
        debug.error("Failed to load existing Razorpay script", e);
        // Try loading with a different approach
        loadScriptWithFallback();
      });
      return;
    }

    loadScriptWithFallback();
  };

  const loadScriptWithFallback = () => {
    try {
      // Load the script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        debug.log("Razorpay script loaded");
        setIsRazorpayLoaded(true);
      };
      script.onerror = (e) => {
        debug.error("Failed to load Razorpay script", e);
        // Try an alternative loading method with JSONP-like approach
        debug.log("Trying alternative loading method...");
        tryAlternativeLoading();
      };
      document.body.appendChild(script);
    } catch (error) {
      debug.error("Error loading Razorpay script:", error);
      // If there's an error, try the alternative method
      tryAlternativeLoading();
    }
  };

  const tryAlternativeLoading = () => {
    // Create a temporary global callback
    const callbackName = `razorpayCallback_${Date.now()}`;
    (window as any)[callbackName] = () => {
      debug.log("Razorpay loaded via alternative method");
      setIsRazorpayLoaded(true);
      // Clean up
      delete (window as any)[callbackName];
    };

    try {
      // Create script with callback
      const script = document.createElement("script");
      script.src = `https://checkout.razorpay.com/v1/checkout.js?callback=${callbackName}`;
      document.body.appendChild(script);

      // Set a timeout to handle case where callback isn't called
      setTimeout(() => {
        if (!(window as any).Razorpay) {
          debug.warn("Razorpay failed to load after timeout, proceeding anyway");
          setIsRazorpayLoaded(true); // Allow payment to proceed anyway
        }
      }, 5000);
    } catch (error) {
      debug.error("Error in alternative loading:", error);
      // If all else fails, just proceed
      setIsRazorpayLoaded(true);
    }
  };

  // Create a Razorpay order
  const createOrder = async () => {
    try {
      setIsProcessingPayment(true);

      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competitionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === "Payment gateway is not configured" ||
            data.error === "Payment gateway is disabled in settings" ||
            data.error === "Payment gateway API keys are missing") {
          throw new Error("Payment system is not properly configured. Please contact support.");
        } else if (data.error && data.error.includes("Authentication failed")) {
          debug.error("Razorpay authentication error details:", data.error);
          throw new Error("Payment system authentication failed. Please contact support.");
        } else {
          throw new Error(data.error || "Failed to create payment order");
        }
      }

      if (data.alreadyPaid) {
        toast({
          title: "Already Paid",
          description: "You have already paid for this competition.",
        });
        router.refresh();
        return null;
      }

      setOrderData(data);
      loadRazorpayScript();
      return data;
    } catch (error) {
      debug.error("Error creating order:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to create payment order",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Open Razorpay payment dialog
  const openRazorpayPayment = (orderData: any) => {
    if (!orderData) {
      toast({
        title: "Payment Error",
        description: "Payment information is not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if we're using the test implementation
    const isTestMode = orderData.keyId.startsWith("rzp_test_");
    if (isTestMode) {
      debug.log("Using Razorpay test mode");
    }

    // For real Razorpay implementation
    if (!window.Razorpay) {
      debug.warn("Razorpay not found in window object");
      if (!isRazorpayLoaded) {
        toast({
          title: "Payment Error",
          description: "Payment system is not ready. Please try again.",
          variant: "destructive",
        });
        // Try to reload the script
        loadRazorpayScript();
        return;
      } else {
        // If isRazorpayLoaded is true but window.Razorpay is not defined,
        // there might be a script loading issue or CSP blocking
        debug.warn("Razorpay script was marked as loaded but window.Razorpay is not defined");
        toast({
          title: "Payment Error",
          description: "Payment system failed to load. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      name: "Vibtrix",
      description: `Payment for ${competitionTitle}`,
      order_id: orderData.order.id,
      handler: function (response: any) {
        verifyPayment(response);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#3399cc",
      },
      // Add error handling callbacks
      modal: {
        ondismiss: function() {
          debug.log("Payment modal dismissed");
          setIsProcessingPayment(false);
        },
        escape: true,
        confirm_close: true
      },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    try {
      // Wrap in a try-catch to handle any initialization errors
      let razorpayInstance;
      try {
        razorpayInstance = new window.Razorpay(options);
      } catch (initError) {
        debug.error("Error initializing Razorpay:", initError);
        throw new Error("Could not initialize payment system");
      }

      // Add event listeners for better error handling
      if (razorpayInstance.on) {
        razorpayInstance.on('payment.failed', function (response: any) {
          debug.error("Payment failed:", response.error);
          toast({
            title: "Payment Failed",
            description: response.error.description || response.error.reason || 'Unknown error',
            variant: "destructive",
          });
          setIsProcessingPayment(false);
        });
      }

      // Open the payment modal
      razorpayInstance.open();
    } catch (error) {
      debug.error("Error opening Razorpay:", error);
      toast({
        title: "Payment Error",
        description: "Failed to open payment gateway. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  // Verify payment with the server
  const verifyPayment = async (response: any) => {
    try {
      setIsProcessingPayment(true);

      // Check if we have all required fields
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        debug.error("Missing required payment response fields:", response);
        throw new Error("Payment response is incomplete. Please try again.");
      }

      debug.log("Verifying payment:", {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        // Don't log the full signature for security
        signatureLength: razorpay_signature?.length,
      });

      // Add retry logic for verification
      let verifyResponse;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              signature: razorpay_signature,
              competitionId,
            }),
          });

          // If successful, break out of retry loop
          break;
        } catch (fetchError) {
          retryCount++;
          debug.error(`Verification request failed (attempt ${retryCount}/${maxRetries + 1});:`, fetchError);

          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff: 1s, 2s)
            const delay = 1000 * retryCount;
            debug.log(`Retrying verification in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Max retries reached, rethrow
            throw new Error("Failed to connect to verification service after multiple attempts");
          }
        }
      }

      if (!verifyResponse) {
        throw new Error("Verification request failed");
      }

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        debug.error("Verification API error:", data);
        throw new Error(data.error || "Payment verification failed");
      }

      debug.log("Payment verified successfully:", data);
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      router.refresh();
    } catch (error) {
      debug.error("Error verifying payment:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Payment verification failed",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleParticipate = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to Google login with the current URL as the return URL
      window.location.href = `/login/google?from=${encodeURIComponent(window.location.href)}`;
      return;
    }

    // Don't proceed if user is already a participant
    if (isParticipant) return;

    if (!isActive || firstRoundCompleted) {
      toast({
        title: "Cannot participate",
        description: firstRoundCompleted
          ? "Enrollment for this competition has ended."
          : "This competition is not currently available for participation.",
        variant: "destructive",
      });
      return;
    }

    // Add rate limiting protection - prevent rapid payment attempts
    const now = Date.now();
    if (lastPaymentAttempt && now - lastPaymentAttempt < 5000) { // 5 second cooldown
      toast({
        title: "Please wait",
        description: "Please wait a few seconds before trying again.",
        variant: "default",
      });
      return;
    }

    setLastPaymentAttempt(now);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/competitions/${competitionId}/participate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to join competition",
          variant: "destructive",
        });
      } else if (data.paymentRequired) {
        // If payment is required, create order and open Razorpay directly
        const orderData = await createOrder();
        if (orderData) {
          // Wait for Razorpay script to load
          if (!isRazorpayLoaded) {
            const checkInterval = setInterval(() => {
              if (isRazorpayLoaded) {
                clearInterval(checkInterval);
                openRazorpayPayment(orderData);
              }
            }, 100);

            // Set a timeout to clear the interval if it takes too long
            setTimeout(() => {
              clearInterval(checkInterval);
              if (!isRazorpayLoaded) {
                // Instead of showing error, proceed with payment anyway
                setIsRazorpayLoaded(true); // Allow payment to proceed
                setIsProcessingPayment(false);
              }
            }, 6000); // Reduced timeout to 6 seconds
          } else {
            openRazorpayPayment(orderData);
          }
        }
      } else {
        toast({
          title: "Success!",
          description: "You have successfully joined the competition.",
        });
        router.refresh();
      }
    } catch (error) {
      debug.error("Error joining competition:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  if (isParticipant) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          className="min-w-[200px] text-base font-medium px-6 py-6"
          size="lg"
          onClick={() => router.push(`/competitions/${competitionId}?tab=upload`)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Post
        </Button>

        {isActive && (
          <Button
            variant="outline"
            className="min-w-[200px] text-base font-medium px-6 py-6"
            size="lg"
            onClick={() => router.push(`/competitions/${competitionId}?tab=feed`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Posts
          </Button>
        )}
      </div>
    );
  }



  return (
    <Button
      onClick={handleParticipate}
      disabled={isLoading || isProcessingPayment || !isActive || firstRoundCompleted}
      className="min-w-[200px] text-base font-medium px-6 py-6"
      size="lg"
    >
      {isLoading || isProcessingPayment ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isProcessingPayment ? "Processing Payment..." : "Processing..."}
        </>
      ) : isPaid && entryFee ? (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Join for ₹{entryFee.toString()}
        </>
      ) : (
        <>
          <Trophy className="mr-2 h-4 w-4" />
          Join Competition
        </>
      )}
    </Button>
  );
}
