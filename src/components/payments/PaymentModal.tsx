"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

import debug from "@/lib/debug";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  competitionTitle: string;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  competitionId,
  competitionTitle,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed">("pending");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("Initializing payment...");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLoadingStep("Loading payment system...");
      // Start loading Razorpay script immediately when modal opens
      loadRazorpayScript();
      // Also create the order
      createOrder();
    }
  }, [isOpen]);

  // Add timeout for loading states - reduced timeout and better handling
  useEffect(() => {
    if (isLoading) {
      // Set a shorter timeout for loading state
      const loadingTimeout = setTimeout(() => {
        if (isLoading) {
          // Instead of showing error, try to proceed anyway
          debug.warn("Loading timeout reached, but proceeding with payment");
          setLoadingStep("Payment ready (timeout reached)");
          setIsRazorpayLoaded(true);
          setIsLoading(false);
        }
      }, 8000); // 8 seconds timeout - shorter for better UX

      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading]);

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

      // Set a shorter timeout for existing script
      const existingTimeout = setTimeout(() => {
        if (!window.Razorpay) {
          debug.warn("Existing script timeout, trying fallback");
          loadScriptWithFallback();
        }
      }, 5000);

      existingScript.addEventListener('load', () => {
        clearTimeout(existingTimeout);
        debug.log("Existing Razorpay script loaded");
        setIsRazorpayLoaded(true);
      });

      existingScript.addEventListener('error', (e) => {
        clearTimeout(existingTimeout);
        debug.error("Failed to load existing Razorpay script", e);
        loadScriptWithFallback();
      });
      return;
    }

    loadScriptWithFallback();
  };

  const loadScriptWithFallback = () => {
    try {
      // Load the script with timeout and better CSP compatibility
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.crossOrigin = "anonymous"; // Add crossOrigin for better COEP compatibility

      // Set a timeout for script loading
      const scriptTimeout = setTimeout(() => {
        debug.warn("Script loading timeout, trying alternative method");
        tryAlternativeLoading();
      }, 10000); // Increased to 10 seconds

      script.onload = () => {
        clearTimeout(scriptTimeout);
        debug.log("Razorpay script loaded successfully");
        setLoadingStep("Payment system ready...");
        setIsRazorpayLoaded(true);
      };

      script.onerror = (e) => {
        clearTimeout(scriptTimeout);
        debug.error("Failed to load Razorpay script", e);
        debug.log("Trying alternative loading method due to script error");
        tryAlternativeLoading();
      };

      // Try appending to head first for better CSP compatibility
      document.head.appendChild(script);
    } catch (error) {
      debug.error("Error loading Razorpay script:", error);
      tryAlternativeLoading();
    }
  };

  const tryAlternativeLoading = () => {
    debug.log("Trying alternative Razorpay loading method");

    // First, check if Razorpay is already available (might have loaded despite errors)
    if (window.Razorpay) {
      debug.log("Razorpay found in window object after all");
      setIsRazorpayLoaded(true);
      return;
    }

    try {
      // Try a different approach - create script without async
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.type = "text/javascript";
      script.crossOrigin = "anonymous";

      const altTimeout = setTimeout(() => {
        if (!window.Razorpay) {
          debug.warn("Alternative loading also failed, but proceeding anyway");
          debug.log("Setting payment system as loaded to prevent infinite loading");
          setLoadingStep("Payment system ready (fallback mode)");
          setIsRazorpayLoaded(true);
        }
      }, 8000); // 8 seconds for alternative method

      script.onload = () => {
        clearTimeout(altTimeout);
        debug.log("Razorpay loaded via alternative method");
        setLoadingStep("Payment system ready...");
        setIsRazorpayLoaded(true);
      };

      script.onerror = () => {
        clearTimeout(altTimeout);
        debug.error("Alternative loading failed, but proceeding anyway");
        debug.log("This might be due to CSP or COEP restrictions");
        setLoadingStep("Payment system ready (fallback mode)");
        setIsRazorpayLoaded(true);
      };

      // Try body instead of head for alternative method
      document.body.appendChild(script);
    } catch (error) {
      debug.error("Error in alternative loading:", error);
      debug.log("Proceeding with payment system anyway");
      setLoadingStep("Payment system ready (fallback mode)");
      setIsRazorpayLoaded(true);
    }
  };

  const createOrder = async (retryAttempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      setLoadingStep("Creating payment order...");

      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competitionId }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (parseError) {
          debug.error("Failed to parse JSON response:", parseError);
          const responseText = await response.text();
          debug.error("Raw response:", responseText);
          throw new Error("Invalid response from payment server. Please try again.");
        }
      } else {
        // Response is not JSON, get text for debugging
        const responseText = await response.text();
        debug.error("Non-JSON response received:", responseText);
        debug.error("Response status:", response.status);
        debug.error("Response headers:", Object.fromEntries(response.headers.entries()));
        throw new Error("Payment server returned an invalid response. Please try again.");
      }

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === "Payment gateway is not configured" ||
            data.error === "Payment gateway is disabled in settings" ||
            data.error === "Payment gateway API keys are missing") {
          throw new Error("Payment system is not properly configured. Please contact support.");
        } else if (data.error && data.error.includes("Authentication failed")) {
          debug.error("Razorpay authentication error details:", data.error);
          throw new Error("Payment system authentication failed. The API keys may be invalid or expired. Please contact support.");
        } else if (data.error && data.error.includes("API key validation failed")) {
          debug.error("Razorpay API key validation error:", data.error);
          throw new Error("Payment system API key validation failed. Please contact support.");
        } else if (data.error && data.error.includes("Too many requests")) {
          // Handle rate limiting with client-side retry
          const maxRetries = 2;
          if (retryAttempt < maxRetries) {
            // Calculate backoff delay: 2s, 4s
            const delay = 2000 * Math.pow(2, retryAttempt);
            setError(`Payment system is busy. Retrying in ${delay/1000} seconds...`);

            // Wait and retry
            setTimeout(() => {
              createOrder(retryAttempt + 1);
            }, delay);
            return;
          } else {
            throw new Error("Payment system is currently busy. Please try again later.");
          }
        } else {
          throw new Error(data.error || "Failed to create payment order");
        }
      }

      if (data.alreadyPaid) {
        setPaymentStatus("success");
        onPaymentSuccess();
        return;
      }

      setOrderData(data);
      setQrCode(data.qrCode);
      setLoadingStep("Payment ready!");
      setIsLoading(false);
    } catch (error) {
      debug.error("Error creating order:", error);
      setError(error instanceof Error ? error.message : "Failed to create payment order");
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (!orderData) {
      setError("Payment information is not available. Please try again.");
      return;
    }

    // Check if we're using the test implementation
    const isTestMode = orderData.keyId.startsWith("rzp_test_");

    if (isTestMode) {
      debug.log("Using Razorpay test mode");
      // For test mode, we use the actual Razorpay checkout
      // but with test credentials that don't process real money
    }

    // For real Razorpay implementation
    if (!window.Razorpay) {
      debug.warn("Razorpay not found in window object");

      // Try to open Razorpay payment page directly as fallback
      debug.log("Attempting fallback payment method - opening Razorpay directly");
      try {
        // Create a direct payment URL
        const paymentParams = new URLSearchParams({
          key_id: orderData.keyId,
          order_id: orderData.order.id,
          amount: orderData.order.amount.toString(),
          currency: orderData.order.currency,
          name: 'VidiBattle',
          description: `Payment for ${competitionTitle}`,
          callback_url: `${window.location.origin}/api/payments/callback`,
          cancel_url: window.location.href
        });

        const paymentUrl = `https://checkout.razorpay.com/v1/checkout.js?${paymentParams.toString()}`;

        // Open in new window
        const paymentWindow = window.open(paymentUrl, 'razorpay_payment', 'width=800,height=600,scrollbars=yes,resizable=yes');

        if (paymentWindow) {
          debug.log("Opened fallback payment window");
          setError("Payment window opened. Please complete the payment in the new window and then refresh this page.");
          return;
        } else {
          // If popup blocked, try direct navigation
          debug.log("Popup blocked, trying direct navigation");
          window.location.href = paymentUrl;
          return;
        }
      } catch (fallbackError) {
        debug.error("Fallback payment method failed", fallbackError);
        setError("Payment system unavailable. Please refresh the page and try again.");
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
          setError(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`);
        });
      }

      // Open the payment modal
      razorpayInstance.open();
    } catch (error) {
      debug.error("Error opening Razorpay:", error);
      setError("Failed to open payment gateway. Please try again.");
    }
  };

  const verifyPayment = async (response: any) => {
    try {
      setIsLoading(true);

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

      // Check if response is JSON before parsing
      const contentType = verifyResponse.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        try {
          data = await verifyResponse.json();
        } catch (parseError) {
          debug.error("Failed to parse verification JSON response:", parseError);
          const responseText = await verifyResponse.text();
          debug.error("Raw verification response:", responseText);
          throw new Error("Invalid response from verification server. Please try again.");
        }
      } else {
        // Response is not JSON, get text for debugging
        const responseText = await verifyResponse.text();
        debug.error("Non-JSON verification response received:", responseText);
        debug.error("Verification response status:", verifyResponse.status);
        throw new Error("Verification server returned an invalid response. Please try again.");
      }

      if (!verifyResponse.ok) {
        debug.error("Verification API error:", data);
        throw new Error(data.error || "Payment verification failed");
      }

      debug.log("Payment verified successfully:", data);
      setPaymentStatus("success");
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      onPaymentSuccess();
    } catch (error) {
      debug.error("Error verifying payment:", error);
      setPaymentStatus("failed");
      setError(error instanceof Error ? error.message : "Payment verification failed");
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
          <DialogTitle>Competition Payment</DialogTitle>
          <DialogDescription>
            Complete payment to join {competitionTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                {loadingStep}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This may take a few seconds...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-destructive">{error}</p>

              {/* Show admin contact info for authentication errors */}
              {error.includes("authentication failed") || error.includes("API key validation failed") ? (
                <div className="mt-4 text-xs text-center">
                  <p className="text-muted-foreground">This is an issue with the payment system configuration.</p>
                  <p className="text-muted-foreground">Please contact the administrator at <span className="font-medium">admin@rektech.uk</span></p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.href = "/"}
                  >
                    Return to Home
                  </Button>
                </div>
              ) : (
                /* Show different button text based on error message */
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => createOrder()}
                  disabled={error.includes("Retrying in")}
                >
                  {error.includes("Retrying in") ? "Please wait..." : "Try Again"}
                </Button>
              )}

              {/* Show additional help text for rate limiting errors */}
              {error.includes("busy") && (
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  The payment system is experiencing high traffic. <br />
                  Please wait a moment before trying again.
                </p>
              )}
            </div>
          ) : paymentStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-xl font-semibold">Payment Successful!</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have successfully joined the competition.
              </p>
              <Button className="mt-4" onClick={handleClose}>
                Continue
              </Button>
            </div>
          ) : (
            <>
              {orderData && (
                <div className="text-center">
                  <p className="font-medium">
                    Amount: ₹{(orderData.order.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Order ID: {orderData.order.id}
                  </p>

                  {orderData.keyId.startsWith("rzp_test_") && (
                    <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You are in test mode. No actual payment will be processed.
                        Use test card number 4111 1111 1111 1111, any future expiry date, and any CVV.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {qrCode && (
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium mb-2">Scan QR to pay</p>
                  <div className="border rounded-md p-2 bg-white">
                    <Image
                      src={qrCode}
                      alt="Payment QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Or use the button below
                  </p>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <Button
                  onClick={handlePayment}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : isRazorpayLoaded ? "Pay Now" : "Pay Now (Fallback)"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
