"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Facebook, Link, Send, Mail, Share2, MessageCircle, Check, Linkedin, Search, Users, X, UserPlus, Loader2 } from "lucide-react";
import InstagramIcon from "@/components/icons/Instagram";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/app/(main)/SessionProvider";
import LoadingButton from "@/components/LoadingButton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import debug from "@/lib/debug";

interface ShareDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  onlineStatus: 'ONLINE' | 'IDLE' | 'OFFLINE';
}

export default function ShareDialog({ postId, open, onOpenChange }: ShareDialogProps) {
  const { toast } = useToast();
  const { user: currentUser, isLoggedIn } = useSession();
  const [isCopied, setIsCopied] = useState(false);

  // User search and selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Generate the post URL
  const getPostUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/posts/${postId}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      const postUrl = getPostUrl();
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);

      // Track the share when copying link
      await trackShare();

      toast({
        title: "Link copied!",
        description: "Post link has been copied to clipboard",
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      debug.error("Failed to copy:", error);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the link to clipboard",
      });
    }
  };

  // Track share in the database
  const trackShare = async () => {
    // Skip tracking for guest users
    if (!isLoggedIn) {
      return;
    }

    try {
      await apiClient.post(`/api/posts/${postId}/shares`);
    } catch (error) {
      debug.error("Failed to track share:", error);
      // Don't show error to user, just log it
    }
  };

  // Share to social media
  const shareToSocialMedia = async (platform: string) => {
    const postUrl = encodeURIComponent(getPostUrl());
    const text = encodeURIComponent("Check out this post!");
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${postUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, but we can open Instagram and let users copy the link
        shareUrl = `https://www.instagram.com/`;
        // Show a toast to guide the user
        toast({
          title: "Instagram sharing",
          description: "Instagram doesn't support direct sharing. Please copy the link and share it manually.",
        });
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text} ${postUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Check out this post&body=${text} ${postUrl}`;
        break;
      default:
        return;
    }

    // Track the share
    await trackShare();

    // Open in a new window
    window.open(shareUrl, '_blank', 'width=600,height=400');
    onOpenChange(false);
  };

  // Search for users
  useEffect(() => {
    // Skip user search for guest users
    if (!isLoggedIn || !currentUser) {
      return;
    }

    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        // Filter out the current user and already selected users
        const filteredUsers = response.data.users.filter(
          user => user.id !== currentUser.id && !selectedUsers.some(selected => selected.id === user.id)
        );
        setUsers(filteredUsers);
      } catch (error) {
        debug.error("Error searching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers();
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, currentUser, isLoggedIn, selectedUsers]);

  // Select a user
  const selectUser = (user: User) => {
    setSelectedUsers(prev => [...prev, user]);
    setUsers(users.filter(u => u.id !== user.id));
    setSearchQuery("");
  };

  // Remove a selected user
  const removeSelectedUser = (user: User) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
  };

  // Send the message
  const sendMessage = async () => {
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "No recipients selected",
        description: "Please select at least one user to send the message to.",
      });
      return;
    }

    setIsSending(true);

    try {
      const postUrl = `${window.location.origin}/posts/${postId}`;
      const message = `Check out this post: ${postUrl}`;

      // Send message to each selected user
      const promises = selectedUsers.map(user =>
        apiClient.post('/api/messages', {
          recipientId: user.id,
          content: message
        })
      );

      await Promise.all(promises);

      // Track the share
      await trackShare();

      toast({
        title: "Message sent!",
        description: `Shared post with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'user' : 'users'}`,
      });

      // Clear selected users
      setSelectedUsers([]);

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      debug.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden rounded-lg border-0 shadow-lg mx-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader className="px-8 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share Post
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6 space-y-5">
          {/* Search and message section - only show for logged in users */}
          {isLoggedIn && currentUser ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Share via direct message</h3>
              <div className="relative">
                <Input
                  placeholder="Search users to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-muted/30 border-primary/20 focus-visible:ring-primary/30"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>

              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-md border border-primary/10">
                  <div className="w-full mb-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Selected recipients:</span>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear all
                    </button>
                  </div>
                  {selectedUsers.map(user => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 pl-1 pr-2 py-1 bg-background/50 hover:bg-background"
                    >
                      <UserAvatar
                        avatarUrl={user.avatarUrl}
                        size={20}
                        showStatus={true}
                        status={user.onlineStatus}
                        statusSize="xs"
                      />
                      <span className="text-xs font-normal">{user.displayName}</span>
                      <button
                        onClick={() => removeSelectedUser(user)}
                        className="ml-1 text-muted-foreground hover:text-destructive rounded-full p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search results */}
              {searchQuery.trim() && (
                <div className="border rounded-md overflow-hidden">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4 bg-muted/30">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Searching...</span>
                    </div>
                  ) : users.length > 0 ? (
                    <ScrollArea className="h-40 bg-muted/10">
                      <div className="p-1">
                        {users.map(user => (
                          <button
                            key={user.id}
                            className="flex items-center gap-3 w-full p-2.5 hover:bg-muted rounded-md transition-colors"
                            onClick={() => selectUser(user)}
                          >
                            <UserAvatar
                              avatarUrl={user.avatarUrl}
                              showStatus={true}
                              status={user.onlineStatus}
                              statusSize="sm"
                            />
                            <div className="text-left">
                              <div className="font-medium">{user.displayName}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                            <UserPlus className="ml-auto size-4 text-primary/70" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 bg-muted/10 text-center">
                      <Users className="size-5 text-muted-foreground mb-1" />
                      <span className="text-sm font-medium">No users found</span>
                      <span className="text-xs text-muted-foreground">Try a different search term</span>
                    </div>
                  )}
                </div>
              )}

              {/* Send message button */}
              {selectedUsers.length > 0 && (
                <LoadingButton
                  loading={isSending}
                  onClick={sendMessage}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                  size="default"
                >
                  <Send className="size-4" />
                  Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
                </LoadingButton>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Share via direct message</h3>
              <div className="flex flex-col items-center justify-center gap-3 p-6 bg-muted/30 rounded-md border border-primary/10">
                <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <MessageCircle className="size-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Sign in to message</p>
                  <p className="text-xs text-muted-foreground">Share this post directly with your friends</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => window.location.href = '/login/google'}
                  className="mt-1 bg-primary hover:bg-primary/90"
                >
                  Sign In with Google
                </Button>
              </div>
            </div>
          )}

          {/* Copy link section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Post link</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 h-8 text-xs font-medium hover:bg-muted/50 px-2.5"
              >
                {isCopied ? (
                  <>
                    <Check className="size-3.5 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-3 border rounded-md p-3 bg-muted/30 relative overflow-hidden">
              <Link className="size-5 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm truncate flex-grow">{getPostUrl()}</span>
            </div>
            {isCopied && (
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-fade-out">
                <div className="bg-background/90 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2">
                  <Check className="size-4 text-green-500" />
                  <span className="text-sm font-medium">Link copied to clipboard!</span>
                </div>
              </div>
            )}
          </div>

          {/* Social sharing buttons */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Share on social media</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mx-auto">
              <SocialButton
                icon={<Facebook className="size-6" />}
                color="#1877F2"
                onClick={() => shareToSocialMedia('facebook')}
                label="Facebook"
              />
              <SocialButton
                icon={<InstagramIcon className="size-6" />}
                color="#E1306C"
                onClick={() => shareToSocialMedia('instagram')}
                label="Instagram"
              />
              <SocialButton
                icon={<MessageCircle className="size-6" />}
                color="#25D366"
                onClick={() => shareToSocialMedia('whatsapp')}
                label="WhatsApp"
              />
              <SocialButton
                icon={<Linkedin className="size-6" />}
                color="#0A66C2"
                onClick={() => shareToSocialMedia('linkedin')}
                label="LinkedIn"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SocialButtonProps {
  icon: React.ReactNode;
  color?: string;
  onClick: () => void;
  label?: string;
}

function SocialButton({ icon, color = "#666", onClick, label }: SocialButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex flex-col items-center justify-center h-16 hover:scale-105 transition-transform duration-200 hover:border-primary/50 p-0 gap-2 w-full"
    >
      <div
        className={cn("size-10 rounded-full flex items-center justify-center")}
        style={{ backgroundColor: `${color}20`, color: color }} // Using hex color with 20% opacity for bg
      >
        {icon}
      </div>
      {label && <span className="text-xs font-medium">{label}</span>}
    </Button>
  );
}
