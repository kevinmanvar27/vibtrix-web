"use client";

import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Circle, Eye, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import debug from "@/lib/debug";

interface PrivacySettingsClientProps {
  showOnlineStatus: boolean;
  isProfilePublic: boolean;
  showWhatsappNumber: boolean;
  showDob: boolean;
  hideYear: boolean;
}

type SettingName = 'showOnlineStatus' | 'isProfilePublic' | 'showWhatsappNumber' | 'showDob' | 'hideYear';

type SettingLabels = {
  [key in SettingName]: string;
};

export default function PrivacySettingsClient({
  showOnlineStatus: initialShowOnlineStatus,
  isProfilePublic: initialIsProfilePublic,
  showWhatsappNumber: initialShowWhatsappNumber,
  showDob: initialShowDob,
  hideYear: initialHideYear
}: PrivacySettingsClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  // State for each setting
  const [showOnlineStatus, setShowOnlineStatus] = useState(initialShowOnlineStatus);
  const [isProfilePublic, setIsProfilePublic] = useState(initialIsProfilePublic);
  const [showWhatsappNumber, setShowWhatsappNumber] = useState(initialShowWhatsappNumber);
  const [showDob, setShowDob] = useState(initialShowDob);
  const [hideYear, setHideYear] = useState(initialHideYear);

  // Loading states for each setting
  const [loadingStates, setLoadingStates] = useState<Record<SettingName, boolean>>({
    showOnlineStatus: false,
    isProfilePublic: false,
    showWhatsappNumber: false,
    showDob: false,
    hideYear: false
  });

  // Human-readable labels for settings
  const settingLabels: SettingLabels = {
    showOnlineStatus: 'Online Status',
    isProfilePublic: 'Public Profile',
    showWhatsappNumber: 'WhatsApp Number',
    showDob: 'Date of Birth',
    hideYear: 'Hide Year in Date of Birth'
  };

  // Function to update a single setting
  const updateSetting = async (name: SettingName, value: boolean) => {
    try {
      // Set loading state for this setting
      setLoadingStates(prev => ({ ...prev, [name]: true }));

      // Prepare the data to send - only send the specific field being updated
      const data: Record<string, boolean> = {
        [name]: value
      };

      // Special case: if showDob is being set to false, also set hideYear to false
      if (name === 'showDob' && value === false) {
        data.hideYear = false;
      }

      debug.log(`Updating ${name} to ${value}`, data);

      const response = await fetch("/api/users/privacy-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: 'include', // Important: include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        debug.error("Server response error:", response.status, errorData);
        throw new Error(`Failed to update ${settingLabels[name]}: ${response.status}`);
      }

      const result = await response.json();
      debug.log(`${settingLabels[name]} updated successfully:`, result);

      // Update the local state with the server response
      if (result.showOnlineStatus !== undefined && name === 'showOnlineStatus') {
        setShowOnlineStatus(result.showOnlineStatus);
      }
      if (result.isProfilePublic !== undefined && name === 'isProfilePublic') {
        setIsProfilePublic(result.isProfilePublic);
      }
      if (result.showWhatsappNumber !== undefined && name === 'showWhatsappNumber') {
        setShowWhatsappNumber(result.showWhatsappNumber);
      }
      if (result.showDob !== undefined && name === 'showDob') {
        setShowDob(result.showDob);
      }
      if (result.hideYear !== undefined && name === 'hideYear') {
        setHideYear(result.hideYear);
      }
      // Note: showUpiId is not implemented in this component yet

      // If showDob is turned off, also update hideYear in the UI
      if (name === 'showDob' && value === false && hideYear) {
        setHideYear(false);
      }

      toast({
        title: "Setting updated",
        description: `Your ${settingLabels[name].toLowerCase()} setting has been saved.`,
      });

      // Refresh the router to ensure all pages reflect the updated privacy settings
      router.refresh();
    } catch (error) {
      debug.error(`Error updating ${name}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${settingLabels[name].toLowerCase()}. Please try again.`,
      });

      // Revert the optimistic UI update on error
      if (name === 'showOnlineStatus') setShowOnlineStatus(!value);
      if (name === 'isProfilePublic') setIsProfilePublic(!value);
      if (name === 'showWhatsappNumber') setShowWhatsappNumber(!value);
      if (name === 'showDob') setShowDob(!value);
      if (name === 'hideYear') setHideYear(!value);

    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [name]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <div>
          <h1 className="text-2xl font-bold">Privacy Settings</h1>
          <p className="text-sm text-muted-foreground">Control who can see your information</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Public Profile */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <label className="text-base font-medium">Public Profile</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Allow anyone to view your profile and posts
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.isProfilePublic && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={isProfilePublic}
                onCheckedChange={(value) => {
                  // Optimistically update UI
                  setIsProfilePublic(value);
                  // Save to server
                  updateSetting('isProfilePublic', value);
                }}
                disabled={loadingStates.isProfilePublic}
              />
            </div>
          </div>
        </div>

        {/* Show Online Status */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-green-500" />
              <label className="text-base font-medium">Show Online Status</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Allow others to see when you're online, idle, or offline
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.showOnlineStatus && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={showOnlineStatus}
                onCheckedChange={(value) => {
                  setShowOnlineStatus(value);
                  updateSetting('showOnlineStatus', value);
                }}
                disabled={loadingStates.showOnlineStatus}
              />
            </div>
          </div>
        </div>

        {/* Show WhatsApp Number */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <label className="text-base font-medium">Show WhatsApp Number</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Allow others to see your WhatsApp number on your profile
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.showWhatsappNumber && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={showWhatsappNumber}
                onCheckedChange={(value) => {
                  setShowWhatsappNumber(value);
                  updateSetting('showWhatsappNumber', value);
                }}
                disabled={loadingStates.showWhatsappNumber}
              />
            </div>
          </div>
        </div>

        {/* Show Date of Birth */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <label className="text-base font-medium">Show Date of Birth</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Show your date of birth on your profile to other users
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.showDob && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={showDob}
                onCheckedChange={(value) => {
                  setShowDob(value);
                  // If turning off showDob, also turn off hideYear
                  if (!value && hideYear) {
                    setHideYear(false);
                  }
                  updateSetting('showDob', value);
                }}
                disabled={loadingStates.showDob}
              />
            </div>
          </div>
        </div>

        {/* Hide Year in Date of Birth */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <label className="text-base font-medium">Hide Year in Date of Birth</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Hide the year and only show day and month (DD/MM) (only applies if "Show Date of Birth" is enabled)
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.hideYear && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={hideYear}
                onCheckedChange={(value) => {
                  setHideYear(value);
                  updateSetting('hideYear', value);
                }}
                disabled={!showDob || loadingStates.hideYear}
              />
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
