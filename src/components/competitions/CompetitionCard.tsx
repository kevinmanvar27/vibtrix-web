"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Image as ImageIcon, Video, Clock, ArrowRight, Trophy, Upload, IndianRupee, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { CompetitionMediaType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import ViewCompetitionButton from "./ViewCompetitionButton";
import { getCompetitionUrl } from "@/lib/slug-utils";
import { cn } from "@/lib/utils";
import { HtmlContent } from "@/components/ui/html-content";
import { useSession } from "@/app/(main)/SessionProvider";

import debug from "@/lib/debug";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CompetitionProps {
  competition: {
    id: string;
    slug?: string | null;
    title: string;
    description: string;
    isPaid: boolean;
    entryFee: number | null;
    mediaType: CompetitionMediaType;
    isActive: boolean;
    hasPrizes?: boolean;
    completionReason?: string | null;
    rounds: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    }[];
    _count: {
      participants: number;
    };
  };
}

export function CompetitionCard({ competition }: CompetitionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoggedIn } = useSession();
  const [isJoining, setIsJoining] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Check if user is already a participant
  useEffect(() => {
    const checkParticipation = async () => {
      try {
        const response = await fetch(`/api/competitions/${competition.id}/check-participation`);
        if (response.ok) {
          const data = await response.json();
          setIsParticipant(data.isParticipant);
        }
      } catch (error) {
        debug.error('Error checking participation:', error);
      }
    };

    checkParticipation();
  }, [competition.id]);

  // Determine competition status
  const currentDate = new Date();
  let status = "Upcoming";

  // Check if the first round has completed (for join button visibility)
  const firstRound = competition.rounds[0];
  const firstRoundCompleted = firstRound && new Date(firstRound.endDate) < currentDate;

  // Add debug logging to understand the competition data
  debug.log(`Competition ${competition.id} (${competition.title}):`, {
    isActive: competition.isActive,
    roundsCount: competition.rounds.length,
    firstRoundStartDate: firstRound ? new Date(firstRound.startDate).toISOString() : 'N/A',
    firstRoundEndDate: firstRound ? new Date(firstRound.endDate).toISOString() : 'N/A',
    currentDate: currentDate.toISOString()
  });

  // Check if competition is inactive or has completion reason (auto-terminated)
  if (!competition.isActive || competition.completionReason) {
    status = "Completed";
  } else if (competition.rounds.length > 0) {
    // Check if any round has started
    const anyRoundStarted = competition.rounds.some(round =>
      new Date(round.startDate) <= currentDate
    );

    // Check if all rounds have ended
    const allRoundsEnded = competition.rounds.every(round =>
      new Date(round.endDate) < currentDate
    );

    // Check if all rounds start in the future (upcoming)
    const allRoundsFuture = competition.rounds.every(round =>
      new Date(round.startDate) > currentDate
    );

    debug.log(`Competition ${competition.title} status calculation:`, {
      anyRoundStarted,
      allRoundsEnded,
      allRoundsFuture
    });

    // Strict status determination to match server-side filtering
    if (allRoundsFuture) {
      // If all rounds start in the future, it's upcoming
      status = "Upcoming";
    } else if (allRoundsEnded) {
      // If all rounds have ended, it's completed
      status = "Completed";
    } else if (anyRoundStarted) {
      // If any round has started but not all have ended, it's active
      status = "Active";
    }
  } else if (!competition.isActive) {
    // If competition is not active, mark it as completed regardless of dates
    status = "Completed";
  }

  debug.log(`Final status for competition ${competition.title}: ${status}`);

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
      // Check if the preloaded script is available
      const preloadedScript = document.querySelector('link[rel="preload"][href*="checkout.razorpay.com"]');
      if (preloadedScript) {
        debug.log("Using preloaded Razorpay script");
      }

      // Load the script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      // Add a shorter timeout for script loading
      const timeout = setTimeout(() => {
        debug.warn("Script loading taking longer than expected");
        // Don't fail, just log the warning
      }, 2000);

      script.onload = () => {
        clearTimeout(timeout);
        debug.log("Razorpay script loaded successfully");
        setIsRazorpayLoaded(true);
      };

      script.onerror = (e) => {
        clearTimeout(timeout);
        debug.error("Failed to load Razorpay script", e);
        // Try an alternative loading method with JSONP-like approach
        debug.log("Trying alternative loading method...");
        tryAlternativeLoading();
      };

      document.head.appendChild(script); // Use head instead of body for better compatibility
    } catch (error) {
      debug.error("Error loading Razorpay script:", error);
      // If there's an error, try the alternative method
      tryAlternativeLoading();
    }
  };

  const tryAlternativeLoading = () => {
    debug.log("Trying alternative Razorpay loading method");

    try {
      // Try loading without callback first
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = false; // Load synchronously for alternative method

      script.onload = () => {
        debug.log("Razorpay loaded via alternative method");
        setIsRazorpayLoaded(true);
      };

      script.onerror = () => {
        debug.warn("Alternative loading also failed, but proceeding anyway");
        // If all loading methods fail, still allow payment to proceed
        // The user can try again if needed
        setIsRazorpayLoaded(true);
      };

      document.head.appendChild(script);

      // Set a shorter timeout for alternative loading
      setTimeout(() => {
        if (!window.Razorpay && !isRazorpayLoaded) {
          debug.warn("Alternative loading timeout, but proceeding anyway");
          setIsRazorpayLoaded(true); // Allow payment to proceed anyway
        }
      }, 3000); // 3 second timeout for alternative method
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
        body: JSON.stringify({ competitionId: competition.id }),
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
        router.push(getCompetitionUrl(competition));
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
      description: `Payment for ${competition.title}`,
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
              competitionId: competition.id,
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
      router.push(getCompetitionUrl(competition));
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

  // Function to handle joining the competition
  const handleJoinCompetition = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    if (!isLoggedIn) {
      // Redirect to Google login with the current URL as the return URL
      window.location.href = `/login/google?from=${encodeURIComponent(window.location.href)}`;
      return;
    }

    try {
      setIsJoining(true);

      const response = await fetch(`/api/competitions/${competition.id}/participate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          window.location.href = `/login/google?from=${encodeURIComponent(window.location.href)}`;
          return;
        }
        throw new Error(data.error || "Failed to join competition");
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
                // Check if Razorpay is actually available even if our flag isn't set
                if (window.Razorpay) {
                  debug.log("Razorpay found in window, updating flag");
                  setIsRazorpayLoaded(true);
                  openRazorpayPayment(orderData);
                } else {
                  // Instead of showing error, proceed with payment anyway
                  debug.log("Razorpay script loading timeout, but proceeding with payment");
                  setIsRazorpayLoaded(true); // Allow payment to proceed
                  setIsProcessingPayment(false);
                }
              }
            }, 3000); // Reduced timeout to 3 seconds
          } else {
            openRazorpayPayment(orderData);
          }
        }
      } else {
        toast({
          title: "Success!",
          description: "You have successfully joined the competition.",
        });
        router.push(getCompetitionUrl(competition));
      }
    } catch (error) {
      // Check if the error message indicates an authentication issue
      const errorMessage = error instanceof Error ? error.message : "Failed to join competition";
      if (errorMessage.toLowerCase().includes("unauthorized")) {
        // Redirect to login if unauthorized
        window.location.href = `/login/google?from=${encodeURIComponent(window.location.href)}`;
        return;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Get the current or next round
  const currentRound = competition.rounds.find(
    round => new Date(round.startDate) <= currentDate && new Date(round.endDate) >= currentDate
  );

  const nextRound = !currentRound && competition.rounds.find(
    round => new Date(round.startDate) > currentDate
  );

  const displayRound = currentRound || nextRound || competition.rounds[0];

  // Get background gradient based on status
  const getStatusGradient = () => {
    if (status === "Active") return "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20";
    if (status === "Upcoming") return "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20";
    return "from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20";
  };

  // Get border color based on status
  const getStatusBorder = () => {
    if (status === "Active") return "border-green-200 dark:border-green-800";
    if (status === "Upcoming") return "border-blue-200 dark:border-blue-800";
    return "border-gray-200 dark:border-gray-800";
  };

  // CSS class for pulsing effect on upcoming competitions that user hasn't joined
  const pulsingClass = status === "Upcoming" && !isParticipant ? "relative" : "";

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-all group bg-gradient-to-br ${getStatusGradient()} ${getStatusBorder()} ${pulsingClass}`}
    >
      {status === "Upcoming" && !isParticipant && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="relative flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-blue-500 items-center justify-center">
              <AlertCircle className="h-3.5 w-3.5 text-white" />
            </span>
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {competition.title}
          </CardTitle>
          <Badge
            variant={status === "Active" ? "default" : status === "Upcoming" ? "secondary" : "outline"}
            className={cn(
              status === "Active" ? "bg-green-500" : "",
              status === "Upcoming" && !isParticipant ? "bg-blue-500 text-white" : "",
              status === "Upcoming" && isParticipant ? "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" : ""
            )}
          >
            {status === "Active" && <Clock className="mr-1 h-3 w-3" />}
            {status === "Upcoming" && <Calendar className="mr-1 h-3 w-3" />}
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground line-clamp-2">
          <HtmlContent html={competition.description} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/50">
            <span className="text-xs text-muted-foreground">Schedule</span>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-500" />
              {displayRound && (
                <span className="font-medium">
                  {currentRound
                    ? `Ends ${format(new Date(displayRound.endDate), "MMM d")}`
                    : `Starts ${format(new Date(displayRound.startDate), "MMM d")}`
                  }
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2 rounded-lg bg-background/50">
            <span className="text-xs text-muted-foreground">Participants</span>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-violet-500" />
              <span className="font-medium">{competition._count.participants}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">
            {competition.mediaType === "IMAGE_ONLY"
              ? <><ImageIcon className="h-3 w-3 mr-1" /> Image Only</>
              : competition.mediaType === "VIDEO_ONLY"
                ? <><Video className="h-3 w-3 mr-1" /> Video Only</>
                : <><ImageIcon className="h-3 w-3 mr-1" /><Video className="h-3 w-3 mx-1" /> Image & Video</>}
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
            {competition.rounds.length} {competition.rounds.length === 1 ? "Round" : "Rounds"}
          </Badge>
          {competition.hasPrizes && (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
              <Trophy className="h-3 w-3 mr-1" /> Cash Prizes
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          asChild
          className="w-full group-hover:bg-primary/90 transition-colors"
          variant={status === "Active" ? "default" : status === "Upcoming" ? "secondary" : "outline"}
        >
          <Link href={getCompetitionUrl(competition)} className="flex items-center justify-center gap-2">
            View Details
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {(status === "Active" || status === "Upcoming") && !firstRoundCompleted && !isParticipant && (
          <Button
            onClick={handleJoinCompetition}
            disabled={isJoining || isProcessingPayment}
            variant="outline"
            className="w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
          >
            {isJoining || isProcessingPayment ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                {isProcessingPayment ? "Processing Payment..." : "Processing..."}
              </>
            ) : competition.isPaid && competition.entryFee ? (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Join for ₹{competition.entryFee}
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Join Competition
              </>
            )}
          </Button>
        )}

        {isParticipant && status !== "Completed" && (
          <Button
            onClick={() => router.push(`${getCompetitionUrl(competition)}?tab=upload`)}
            variant="outline"
            className="w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Post
          </Button>
        )}

        {/* View Competition Feed button - only shown for active competitions */}
        <ViewCompetitionButton
          competitionId={competition.id}
          competitionSlug={competition.slug}
          isActive={status === "Active"}
        />
      </CardFooter>


    </Card>
  );
}
