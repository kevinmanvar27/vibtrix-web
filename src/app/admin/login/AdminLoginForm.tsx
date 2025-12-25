"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "./actions";
import { Eye, EyeOff } from "lucide-react";

import debug from "@/lib/debug";

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

interface AdminLoginFormProps {
  redirectUrl?: string;
  errorMessage?: string;
}

export default function AdminLoginForm({ redirectUrl = "/admin/dashboard", errorMessage }: AdminLoginFormProps) {
  const [error, setError] = useState<string | null>(errorMessage || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Update error message if it changes from props
  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    debug.log("Admin login form - Submitting form");
    setIsLoading(true);
    setError(null);

    try {
      debug.log(`Admin login form - Calling adminLogin with username/email: ${values.usernameOrEmail}`);
      const result = await adminLogin(values);

      if (result.error) {
        debug.log(`Admin login form - Login error: ${result.error}`);
        setError(result.error);
      } else {
        debug.log("Admin login form - Login successful, redirecting");
        // Prevent redirect loops by checking if we're redirecting to the login page
        const targetUrl = redirectUrl === "/admin/login" ? "/admin/dashboard" : redirectUrl;
        debug.log(`Admin login form - Redirecting to: ${targetUrl}`);

        // For admin login, we still need a full page refresh to ensure the session is properly recognized
        // This is an exception to the SPA pattern, but necessary for security
        window.location.href = targetUrl;
      }
    } catch (error) {
      debug.log("Admin login form - Unexpected error");
      setError("An unexpected error occurred. Please try again.");
      debug.error("Admin login form - Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="usernameOrEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username or Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username or email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
