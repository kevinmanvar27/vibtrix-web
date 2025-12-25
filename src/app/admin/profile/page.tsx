"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Shield, User, Mail, Lock } from "lucide-react";

import debug from "@/lib/debug";

export default function AdminProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // User data state
  const [userData, setUserData] = useState({
    id: "",
    username: "",
    displayName: "",
    email: "",
    avatarUrl: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data on mount
  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserData(data.user);
          setFormData(prev => ({
            ...prev,
            username: data.user.username || "",
            displayName: data.user.displayName || "",
            email: data.user.email || "",
          }));
        }
        setIsLoading(false);
      })
      .catch(err => {
        debug.error("Failed to load profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send update request
      const response = await fetch("/api/admin/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      // Update user data with new values
      setUserData(prev => ({
        ...prev,
        username: formData.username,
        displayName: formData.displayName,
        email: formData.email,
      }));

      // Success
      toast({
        title: "Profile updated",
        description: "Your admin profile has been updated successfully.",
      });

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

    } catch (error: any) {
      debug.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow-sm min-h-[600px]">
        <div className="bg-gradient-to-r from-primary/10 to-primary/30 p-6 rounded-t-lg animate-pulse">
          <div className="h-8 w-64 bg-muted/50 rounded-md"></div>
          <div className="h-4 w-96 bg-muted/40 rounded-md mt-2"></div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Skeleton for profile card */}
            <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col items-center md:w-1/3 animate-pulse">
              <div className="h-32 w-32 rounded-full bg-muted/50"></div>
              <div className="w-full mt-4 space-y-3">
                <div className="h-6 w-32 bg-muted/50 rounded-md mx-auto"></div>
                <div className="h-4 w-24 bg-muted/40 rounded-md mx-auto"></div>
                <div className="h-8 w-full bg-muted/30 rounded-md mt-4"></div>
              </div>
            </div>

            {/* Skeleton for form */}
            <div className="bg-card rounded-lg shadow-sm p-6 md:w-2/3 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={i === 3 ? "md:col-span-2" : ""}>
                    <div className="h-4 w-24 bg-muted/50 rounded-md"></div>
                    <div className="h-10 w-full bg-muted/40 rounded-md mt-2"></div>
                    <div className="h-3 w-32 bg-muted/30 rounded-md mt-1"></div>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-muted/50 my-6"></div>

              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={i === 1 ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                    {i === 1 ? (
                      <div>
                        <div className="h-4 w-32 bg-muted/50 rounded-md"></div>
                        <div className="h-10 w-full bg-muted/40 rounded-md mt-2"></div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="h-4 w-24 bg-muted/50 rounded-md"></div>
                          <div className="h-10 w-full bg-muted/40 rounded-md mt-2"></div>
                          <div className="h-3 w-32 bg-muted/30 rounded-md mt-1"></div>
                        </div>
                        <div>
                          <div className="h-4 w-36 bg-muted/50 rounded-md"></div>
                          <div className="h-10 w-full bg-muted/40 rounded-md mt-2"></div>
                          <div className="h-3 w-32 bg-muted/30 rounded-md mt-1"></div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <div className="h-10 w-32 bg-primary/30 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 animate-pulse">
            <div className="h-4 w-full bg-muted/40 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-sm">
      {/* Header with background gradient */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/30 p-6 rounded-t-lg">
        <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your administrator account settings and credentials
        </p>
      </div>

      <div className="p-6">
        {/* Profile overview card with avatar and basic info */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col items-center md:w-1/3">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={userData.avatarUrl || undefined} alt={userData.displayName} />
              <AvatarFallback className="bg-primary/20 text-primary-foreground text-3xl">
                {userData.displayName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center mt-4 w-full">
              <h2 className="text-2xl font-bold">{userData.displayName}</h2>
              <p className="text-muted-foreground">@{userData.username}</p>
              {userData.email && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
                  {userData.email}
                </div>
              )}
              <div className="mt-4 p-2 bg-primary/10 rounded-md text-sm font-medium text-primary flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Administrator Account
              </div>
            </div>
          </div>

          {/* Edit profile form */}
          <div className="bg-card rounded-lg shadow-sm p-6 md:w-2/3">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your unique identifier on the platform
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Enter display name"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How your name appears to other users
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for account recovery and notifications
                  </p>
                </div>
              </div>

              {/* Password section with visual separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Settings
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Current Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showCurrentPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      New Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showNewPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 8 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      Confirm New Password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Must match new password
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional information card */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p>As an administrator, your profile information is visible to other administrators. Your username and display name may also be visible to users when you perform administrative actions.</p>
        </div>
      </div>
    </div>
  );
}
