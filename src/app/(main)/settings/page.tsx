import { validateRequest } from "@/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ban, Bell, Eye, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFeatureSettings } from "@/lib/get-feature-settings";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { user } = await validateRequest();
  const { userBlockingEnabled, loginActivityTrackingEnabled } = await getFeatureSettings();

  if (!user) {
    return notFound();
  }

  // Redirect to the notifications page by default
  return redirect('/settings/notifications');
}
