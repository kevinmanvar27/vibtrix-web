'use client';


import EnhancedFollowButton from "@/components/EnhancedFollowButton";
import FollowerCount from "@/components/FollowerCount";
import Linkify from "@/components/Linkify";
import UserAvatar from "@/components/UserAvatar";
import { useClientOnlyUserOnlineStatus } from "@/hooks/useClientOnlyUserOnlineStatus";
import { FollowerInfo, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Ban, Instagram, Facebook, Twitter, Linkedin, Globe, CreditCard, User, Calendar, Info } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import MessageButton from "../../search/MessageButton";

import { Button } from "@/components/ui/button";
import EditProfileButton from "./EditProfileButton";
import { useFeatureSettings } from "@/hooks/use-feature-settings";
import { Camera, Briefcase, DollarSign, ShoppingBag } from "lucide-react";

import debug from "@/lib/debug";

interface UserProfileClientProps {
  user: UserData;
  loggedInUserId: string;
  followerInfo: FollowerInfo;
  isPrivateProfile?: boolean;
  hasPendingRequest?: boolean;
  isGuestView?: boolean;
}

export default function UserProfileClient({
  user,
  loggedInUserId,
  followerInfo,
  isPrivateProfile = false,
  hasPendingRequest = false,
  isGuestView = false
}: UserProfileClientProps) {
  const { data: onlineStatusData } = useClientOnlyUserOnlineStatus(user.id);
  const {
    userBlockingEnabled,
    messagingEnabled,
    modelingFeatureEnabled,
    modelingMinFollowers,
    modelingPhotoshootLabel,
    modelingVideoAdsLabel,
    brandAmbassadorshipEnabled,
    brandAmbassadorshipMinFollowers,
    brandAmbassadorshipPricingLabel,
    brandAmbassadorshipPreferencesLabel
  } = useFeatureSettings();
  const { toast } = useToast();
  const router = useRouter();

  return (
    <div className="h-fit w-full rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={100}
          className="flex-shrink-0"
          showStatus={user.id === loggedInUserId || user.showOnlineStatus}
          status={(onlineStatusData?.status || user.onlineStatus) as any}
          statusSize="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap justify-between gap-2 mb-2">
            <div>
              <h1 className="text-2xl font-bold truncate">{user.displayName}</h1>
              <div className="text-muted-foreground">@{user.username}</div>
              <div className="text-sm mt-1">Member since {formatDate(user.createdAt, "MMM d, yyyy")}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>
              Posts:{" "}
              <span className="font-semibold">
                {formatNumber(user._count.posts)}
              </span>
            </span>
            <FollowerCount userId={user.id} initialState={followerInfo} />
          </div>

          {/* Modeling Section - Hidden from profile page as requested */}

          {/* Brand Ambassadorship Section - Hidden from profile page as requested */}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 mt-3">
        {isGuestView ? (
          <Button
            size="sm"
            onClick={() => {
              // Redirect to Google login with return URL using router for client-side navigation
              const returnUrl = window.location.href;
              router.push(`/login/google?from=${encodeURIComponent(returnUrl)}`);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Sign in to interact
          </Button>
        ) : user.id === loggedInUserId ? (
          <EditProfileButton user={user} />
        ) : (
          <>
            {followerInfo.isFollowedByUser && messagingEnabled && (
              <MessageButton userId={user.id} />
            )}
            <EnhancedFollowButton
              userId={user.id}
              initialState={followerInfo}
              isPrivateProfile={isPrivateProfile}
              hasPendingRequest={hasPendingRequest}
            />
            {userBlockingEnabled && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  if (confirm(`Are you sure you want to block @${user.username}? They won't be able to find your profile, message you, or appear in your search results.`)) {
                    fetch(`/api/users/${user.id}/block`, { method: 'POST' })
                      .then(() => {
                        toast({
                          title: "User blocked",
                          description: `You have blocked @${user.username}`,
                        });
                        router.push('/');
                      })
                      .catch(() => {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Failed to block user. Please try again.",
                        });
                      });
                  }
                }}
              >
                <Ban className="h-4 w-4" />
                Block
              </Button>
            )}
          </>
        )}
      </div>
      {(user.bio || user.gender || user.dateOfBirth || user.socialLinks || (user.whatsappNumber && (user.id === loggedInUserId || user.showWhatsappNumber))) && (
        <>
          <hr className="my-3" />
          {user.bio && (
            <div className="overflow-hidden whitespace-pre-line break-words mb-3 text-sm">
              <Linkify>{user.bio}</Linkify>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-2 mb-1">
            {/* Gender with icon */}
            {user.gender && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                title="Gender"
              >
                <User className="h-3.5 w-3.5" />
                <span>{user.gender}</span>
              </div>
            )}

            {/* Date of Birth with icon */}
            {user.dateOfBirth && (user.id === loggedInUserId || user.showDob) && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Date of Birth"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {
                    (() => {
                      try {
                        // Check if date is in DD-MM-YYYY format
                        if (/^\d{2}-\d{2}-\d{4}$/.test(user.dateOfBirth)) {
                          const parts = user.dateOfBirth.split('-');

                          // If user is viewing their own profile, show full date
                          if (user.id === loggedInUserId) {
                            return `${parts[0]}/${parts[1]}/${parts[2]}`; // Show full date with / separator
                          }

                          // If hide year is enabled, show only day and month (DD/MM format)
                          if (user.hideYear) {
                            return `${parts[0]}/${parts[1]}`; // Show only day and month with / separator
                          }
                          // Default: show full date (DD/MM/YYYY format)
                          else {
                            return `${parts[0]}/${parts[1]}/${parts[2]}`; // Show full date with / separator
                          }
                        }

                        // For any other format, just display as is
                        return user.dateOfBirth;
                      } catch (error) {
                        // Fallback for any parsing errors
                        return user.dateOfBirth;
                      }
                    })()
                  }
                </span>
              </div>
            )}
          </div>

          {/* Social Media Links */}
          <div className="mt-2">
            <div className="flex flex-wrap gap-3">
              {/* WhatsApp */}
              {user.whatsappNumber && (user.id === loggedInUserId || user.showWhatsappNumber) && (
                <Link
                  href={`https://wa.me/${user.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                  title={`WhatsApp: ${user.whatsappNumber}`}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </Link>
              )}

              {/* Other Social Media */}
              {user.socialLinks && (() => {
                try {
                  const socialLinks = typeof user.socialLinks === 'object'
                    ? user.socialLinks
                    : JSON.parse(user.socialLinks as string);

                  return (
                    <>
                      {socialLinks?.instagram && (
                        <Link
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-colors"
                          title="Instagram"
                        >
                          <Instagram className="h-4 w-4" />
                        </Link>
                      )}
                      {socialLinks?.facebook && (
                        <Link
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="h-4 w-4" />
                        </Link>
                      )}
                      {socialLinks?.twitter && (
                        <Link
                          href={socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 transition-colors"
                          title="X/Twitter"
                        >
                          <Twitter className="h-4 w-4" />
                        </Link>
                      )}
                      {socialLinks?.youtube && (
                        <Link
                          href={socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          title="YouTube"
                        >
                          <YouTubeIcon className="h-4 w-4" />
                        </Link>
                      )}
                      {socialLinks?.linkedin && (
                        <Link
                          href={socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="h-4 w-4" />
                        </Link>
                      )}
                      {socialLinks?.website && (
                        <Link
                          href={socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                          title="Website"
                        >
                          <Globe className="h-4 w-4" />
                        </Link>
                      )}
                    </>
                  );
                } catch (e) {
                  debug.error('Error parsing social links:', e);
                  return null;
                }
              })()}
            </div>
          </div>


        </>
      )}
    </div>
  );
}


