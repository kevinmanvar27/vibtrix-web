"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import LoadingButton from "@/components/LoadingButton";
import { PasswordInput } from "@/components/PasswordInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Step 1: OTP Verification Schema
const otpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Step 2: New Password Schema
const newPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type OTPValues = z.infer<typeof otpSchema>;
type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export default function ResetPasswordForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [resetToken, setResetToken] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // OTP input refs for auto-focus
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);

  // Step 1 form
  const otpForm = useForm<OTPValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  // Step 2 form
  const passwordForm = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Get email from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      otpForm.setValue("email", storedEmail);
    }
  }, [otpForm]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Only take last character
    setOtpDigits(newDigits);

    // Update form value
    const fullOtp = newDigits.join("");
    otpForm.setValue("otp", fullOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    otpForm.setValue("otp", newDigits.join(""));
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newDigits.findIndex(d => !d);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Verify OTP
  async function onVerifyOTP(values: OTPValues) {
    setError(undefined);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/verify-reset-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid OTP");
          return;
        }

        // Store the token and move to step 2
        setResetToken(data.token);
        setStep(2);
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  // Reset password
  async function onResetPassword(values: NewPasswordValues) {
    setError(undefined);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: resetToken,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to reset password");
          return;
        }

        setSuccess(true);
        // Clear stored email
        sessionStorage.removeItem("resetEmail");
        // Redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  // Resend OTP
  async function handleResendOTP() {
    const email = otpForm.getValues("email");
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError(undefined);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          setResendCooldown(60);
          // Reset OTP fields
          setOtpDigits(["", "", "", "", "", ""]);
          otpForm.setValue("otp", "");
        }
      } catch (err) {
        setError("Failed to resend OTP");
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-600">
          Password Reset Successful!
        </h3>
        <p className="text-muted-foreground">
          Your password has been reset. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          1
        </div>
        <div className={`h-1 w-16 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
          step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          2
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 1 ? (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
            <FormField
              control={otpForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Enter OTP</FormLabel>
              <div className="flex justify-center gap-2">
                {otpDigits.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-12 text-center text-lg font-semibold"
                    disabled={isPending}
                  />
                ))}
              </div>
              {otpForm.formState.errors.otp && (
                <p className="text-sm text-destructive">
                  {otpForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={handleResendOTP}
                disabled={isPending || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </Button>
            </div>

            <LoadingButton loading={isPending} type="submit" className="w-full">
              Verify OTP
            </LoadingButton>
          </form>
        </Form>
      ) : (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter new password"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Confirm new password"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton loading={isPending} type="submit" className="w-full">
              Reset Password
            </LoadingButton>
          </form>
        </Form>
      )}
    </div>
  );
}
