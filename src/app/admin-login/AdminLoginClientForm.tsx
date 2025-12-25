"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { adminLogin } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import debug from "@/lib/debug";

export default function AdminLoginClientForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get error message from URL if present
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Log the start of the login attempt
      debug.log("Starting login attempt...");

      const formData = new FormData(event.currentTarget);
      debug.log("Form data created, calling adminLogin...");

      // Add a timeout to detect if the server action is hanging
      const loginPromise = adminLogin(formData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login request timed out after 10 seconds")), 10000)
      );

      // Race the login promise against the timeout
      const result = await Promise.race([loginPromise, timeoutPromise]);
      debug.log("Login result received:", result);

      if ((result as any)?.success && (result as any)?.redirectTo) {
        // Navigate to the dashboard
        debug.log("Login successful, redirecting to:", (result as any).redirectTo);
        window.location.href = (result as any).redirectTo;
      } else if (!(result as any)?.success && (result as any)?.error) {
        // Show error
        debug.log("Login failed with error:", (result as any).error);
        setError((result as any).error);
      }
    } catch (error) {
      // Log detailed error information
      debug.error("Error during login:", error);
      debug.error("Error during login:", error);

      // Provide more detailed error message to the user
      if (error instanceof Error) {
        setError(`Login failed: ${error.message}`);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // State to track if we should use the fallback method
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {useFallback ? (
        // Fallback method using traditional form submission
        <form action="/api/admin/login" method="POST" className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="usernameOrEmail">Username or Email</Label>
              <Input
                id="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="Enter your username or email"
                required
                defaultValue="admin"
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Login (Fallback Method)
            </Button>
          </div>
        </form>
      ) : (
        // Primary method using server actions
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="usernameOrEmail">Username or Email</Label>
              <Input
                id="usernameOrEmail"
                name="usernameOrEmail"
                placeholder="Enter your username or email"
                required
                defaultValue="admin"
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      )}

      {/* Toggle button to switch between methods */}
      <div className="text-center">
        <Button
          variant="link"
          type="button"
          onClick={() => setUseFallback(!useFallback)}
          className="text-xs"
        >
          {useFallback
            ? "Switch to primary login method"
            : "Having trouble? Try alternative login method"}
        </Button>
      </div>
    </div>
  );
}
