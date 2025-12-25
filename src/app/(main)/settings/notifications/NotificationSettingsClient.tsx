"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";

import debug from "@/lib/debug";

interface NotificationSettingsClientProps {
  preferences: {
    likeNotifications: boolean;
    followNotifications: boolean;
    commentNotifications: boolean;
  };
}

type SettingName = 'likeNotifications' | 'followNotifications' | 'commentNotifications';

type SettingLabels = {
  [key in SettingName]: string;
};

export default function NotificationSettingsClient({ preferences }: NotificationSettingsClientProps) {
  const { toast } = useToast();

  // State for each setting
  const [likeNotifications, setLikeNotifications] = useState(preferences.likeNotifications);
  const [followNotifications, setFollowNotifications] = useState(preferences.followNotifications);
  const [commentNotifications, setCommentNotifications] = useState(preferences.commentNotifications);

  // Loading states for each setting
  const [loadingStates, setLoadingStates] = useState<Record<SettingName, boolean>>({
    likeNotifications: false,
    followNotifications: false,
    commentNotifications: false
  });

  // Human-readable labels for settings
  const settingLabels: SettingLabels = {
    likeNotifications: 'Like Notifications',
    followNotifications: 'Follow Notifications',
    commentNotifications: 'Comment Notifications'
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

      debug.log(`Updating ${name} to ${value}`, data);

      const response = await fetch("/api/users/notification-preferences", {
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
      if (result.likeNotifications !== undefined && name === 'likeNotifications') {
        setLikeNotifications(result.likeNotifications);
      }
      if (result.followNotifications !== undefined && name === 'followNotifications') {
        setFollowNotifications(result.followNotifications);
      }
      if (result.commentNotifications !== undefined && name === 'commentNotifications') {
        setCommentNotifications(result.commentNotifications);
      }

      toast({
        title: "Setting updated",
        description: `Your ${settingLabels[name].toLowerCase()} setting has been saved.`,
      });
    } catch (error) {
      debug.error(`Error updating ${name}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${settingLabels[name].toLowerCase()}. Please try again.`,
      });

      // Revert the optimistic UI update on error
      if (name === 'likeNotifications') setLikeNotifications(!value);
      if (name === 'followNotifications') setFollowNotifications(!value);
      if (name === 'commentNotifications') setCommentNotifications(!value);

    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [name]: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Settings</h1>
          <p className="text-sm text-muted-foreground">Manage which notifications you receive</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Like Notifications */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <label className="text-base font-medium">Like Notifications</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications when someone likes your post
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.likeNotifications && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={likeNotifications}
                onCheckedChange={(value) => {
                  // Optimistically update UI
                  setLikeNotifications(value);
                  // Save to server
                  updateSetting('likeNotifications', value);
                }}
                disabled={loadingStates.likeNotifications}
              />
            </div>
          </div>
        </div>

        {/* Follow Notifications */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-500" />
              <label className="text-base font-medium">Follow Notifications</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications when someone follows you
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.followNotifications && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={followNotifications}
                onCheckedChange={(value) => {
                  setFollowNotifications(value);
                  updateSetting('followNotifications', value);
                }}
                disabled={loadingStates.followNotifications}
              />
            </div>
          </div>
        </div>

        {/* Comment Notifications */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" />
              <label className="text-base font-medium">Comment Notifications</label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications when someone comments on your post
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {loadingStates.commentNotifications && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Switch
                checked={commentNotifications}
                onCheckedChange={(value) => {
                  setCommentNotifications(value);
                  updateSetting('commentNotifications', value);
                }}
                disabled={loadingStates.commentNotifications}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
