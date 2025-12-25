"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { PrizePosition } from "@prisma/client";
import { Award, Check, Copy, IndianRupee, Loader2, Trophy, User, X, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { processPrizePayment } from "../actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import debug from "@/lib/debug";

interface PrizePaymentsSectionProps {
  competitionId: string;
  winners?: Array<{
    position: PrizePosition;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    upiId: string | null;
    prize: {
      id: string;
      amount: number;
      description: string | null;
    } | null;
    payment: {
      id: string;
      status: string;
      processedAt: Date | null;
      transactionId: string | null;
    } | null;
  }>;
}

const prizePaymentSchema = z.object({
  prizeId: z.string(),
  userId: z.string(),
  amount: z.coerce.number().min(0, "Amount must be at least 0"),
  upiId: z.string().min(1, "UPI ID is required"),
  notes: z.string().optional(),
});

export default function PrizePaymentsSection({ competitionId, winners = [] }: PrizePaymentsSectionProps) {
  const [selectedWinner, setSelectedWinner] = useState<typeof winners[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Form for transaction ID when completing a payment
  const completeForm = useForm({
    resolver: zodResolver(z.object({
      transactionId: z.string().min(1, "Transaction ID is required"),
    })),
    defaultValues: {
      transactionId: "",
    },
  });

  // Form for notes when failing a payment
  const failForm = useForm({
    resolver: zodResolver(z.object({
      notes: z.string().optional(),
    })),
    defaultValues: {
      notes: "",
    },
  });

  const form = useForm<z.infer<typeof prizePaymentSchema>>({
    resolver: zodResolver(prizePaymentSchema),
    defaultValues: {
      prizeId: "",
      userId: "",
      amount: 0,
      upiId: "",
      notes: "",
    },
  });

  const handlePayPrize = (winner: typeof winners[0]) => {
    if (!winner.prize) {
      toast({
        title: "No prize defined",
        description: "This position doesn't have a prize amount defined.",
        variant: "destructive",
      });
      return;
    }

    setSelectedWinner(winner);
    form.reset({
      prizeId: winner.prize.id,
      userId: winner.userId,
      amount: winner.prize.amount,
      upiId: winner.upiId || "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof prizePaymentSchema>) => {
    try {
      setIsProcessing(true);
      await processPrizePayment(competitionId, values);
      toast({
        title: "Payment processed",
        description: "The prize payment has been processed successfully.",
      });
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompletePayment = async (data: { transactionId: string }) => {
    if (!selectedPaymentId) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/prize-payments/${selectedPaymentId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete payment");
      }

      toast({
        title: "Payment completed",
        description: "The prize payment has been marked as completed.",
      });
      setIsCompleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFailPayment = async (data: { notes?: string }) => {
    if (!selectedPaymentId) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/prize-payments/${selectedPaymentId}/fail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark payment as failed");
      }

      toast({
        title: "Payment failed",
        description: "The prize payment has been marked as failed.",
      });
      setIsFailDialogOpen(false);
      router.refresh();
    } catch (error) {
      debug.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark payment as failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The UPI ID has been copied to your clipboard.",
    });
  };

  const getPositionLabel = (position: PrizePosition) => {
    switch (position) {
      case "FIRST":
        return "1st Place";
      case "SECOND":
        return "2nd Place";
      case "THIRD":
        return "3rd Place";
      case "FOURTH":
        return "4th Place";
      case "FIFTH":
        return "5th Place";
      case "PARTICIPATION":
        return "Participation";
      default:
        return position;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "PROCESSING":
        return <Badge variant="secondary">Processing</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Qualified Winner Prize Payments
          </CardTitle>
          <CardDescription>
            Process payments for competition winners who met the required likes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!winners || winners.length === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-lg bg-card">
              <Award className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No Qualified Winners Yet</h3>
              <p className="text-sm text-muted-foreground">
                Qualified winners who met the required likes will appear here once the competition is completed.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Winners List */}
              {/* First Place Winner - Highlighted */}
              {winners.filter(w => w.position === "FIRST").map((winner) => (
                <div key={winner.userId} className="border rounded-lg p-4 bg-primary/5 dark:bg-primary/10 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        {winner.avatarUrl ? (
                          <AvatarImage src={winner.avatarUrl} alt={winner.displayName} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{winner.displayName}</span>
                          <Badge variant="outline" className="font-normal">
                            {getPositionLabel(winner.position)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">@{winner.username}</div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {winner.prize && (
                        <div className="flex flex-col items-start">
                          <div className="text-sm text-muted-foreground">Prize Amount</div>
                          <div className="flex items-center font-bold text-xl">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {winner.prize.amount.toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-[150px]">
                        {winner.payment?.status === "COMPLETED" ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                            <Check className="h-5 w-5" />
                            <span className="font-medium">Prize Paid</span>
                          </div>
                        ) : winner.payment?.status === "PROCESSING" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPaymentId(winner.payment!.id);
                                  completeForm.reset({ transactionId: "" });
                                  setIsCompleteDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPaymentId(winner.payment!.id);
                                  failForm.reset({ notes: "" });
                                  setIsFailDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Mark as Failed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : winner.payment?.status === "FAILED" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                              <X className="h-5 w-5" />
                              <span className="font-medium">Payment Failed</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayPrize(winner)}
                              disabled={!winner.prize}
                              className="w-full"
                            >
                              <IndianRupee className="h-4 w-4 mr-2" />
                              Retry Payment
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePayPrize(winner)}
                            disabled={!winner.prize}
                            className="w-full"
                            variant="default"
                          >
                            <IndianRupee className="h-4 w-4 mr-2" />
                            Pay First Prize
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {winner.upiId && (
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">UPI ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">{winner.upiId}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => winner.upiId && copyToClipboard(winner.upiId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Other Winners */}
              {winners.filter(w => w.position !== "FIRST").map((winner) => (
                <div key={winner.userId} className="border rounded-lg p-4 bg-card shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-muted">
                        {winner.avatarUrl ? (
                          <AvatarImage src={winner.avatarUrl} alt={winner.displayName} />
                        ) : (
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">{winner.displayName}</span>
                          <Badge variant="outline" className="font-normal">
                            {getPositionLabel(winner.position)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">@{winner.username}</div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {winner.prize && (
                        <div className="flex flex-col items-start">
                          <div className="text-sm text-muted-foreground">Prize Amount</div>
                          <div className="flex items-center font-bold text-xl">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            {winner.prize.amount.toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-[150px]">
                        {winner.payment?.status === "COMPLETED" ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                            <Check className="h-5 w-5" />
                            <span className="font-medium">Prize Paid</span>
                          </div>
                        ) : winner.payment?.status === "PROCESSING" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="w-full">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPaymentId(winner.payment!.id);
                                  completeForm.reset({ transactionId: "" });
                                  setIsCompleteDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPaymentId(winner.payment!.id);
                                  failForm.reset({ notes: "" });
                                  setIsFailDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Mark as Failed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : winner.payment?.status === "FAILED" ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                              <X className="h-5 w-5" />
                              <span className="font-medium">Payment Failed</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayPrize(winner)}
                              disabled={!winner.prize}
                              className="w-full"
                            >
                              <IndianRupee className="h-4 w-4 mr-2" />
                              Retry Payment
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePayPrize(winner)}
                            disabled={!winner.prize}
                            className="w-full"
                            variant="default"
                          >
                            <IndianRupee className="h-4 w-4 mr-2" />
                            Pay Prize
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {winner.upiId && (
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">UPI ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">{winner.upiId}</code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => winner.upiId && copyToClipboard(winner.upiId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}


            </div>
          )}
        </CardContent>
      </Card>

        {/* Process Payment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Process Prize Payment</DialogTitle>
              <DialogDescription>
                Pay prize to {selectedWinner?.displayName} (@{selectedWinner?.username})
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID / GPay Number</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            onClick={() => field.value && copyToClipboard(field.value)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes about this payment"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        This will be visible only to administrators.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Process Payment
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Complete Payment Dialog */}
        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Complete Prize Payment</DialogTitle>
              <DialogDescription>
                Mark this payment as completed by providing the transaction ID
              </DialogDescription>
            </DialogHeader>

            <Form {...completeForm}>
              <form onSubmit={completeForm.handleSubmit(handleCompletePayment)} className="space-y-4">
                <FormField
                  control={completeForm.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter UPI/GPay transaction ID" />
                      </FormControl>
                      <FormDescription>
                        Enter the transaction ID from your payment provider
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCompleteDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Fail Payment Dialog */}
        <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Mark Payment as Failed
              </DialogTitle>
              <DialogDescription>
                Provide a reason why this payment failed
              </DialogDescription>
            </DialogHeader>

            <Form {...failForm}>
              <form onSubmit={failForm.handleSubmit(handleFailPayment)} className="space-y-4">
                <FormField
                  control={failForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Failure Reason (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter reason for payment failure"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFailDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Mark as Failed
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
