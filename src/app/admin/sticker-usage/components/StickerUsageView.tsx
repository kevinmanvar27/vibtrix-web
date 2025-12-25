"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { StickerPosition } from "@prisma/client";
import VideoWithSticker from "@/components/competitions/VideoWithSticker";
import ImageWithSticker from "@/components/competitions/ImageWithSticker";

interface StickerUsageViewProps {
  usage: any; // Using any for simplicity, but should be properly typed
}

export default function StickerUsageView({ usage }: StickerUsageViewProps) {
  const [open, setOpen] = useState(false);

  // If there's no media or post associated with this usage, show a disabled button
  if (!usage.media || !usage.media.post) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Eye className="h-4 w-4 mr-1" />
        Not found
      </Button>
    );
  }

  const { media } = usage;
  const { post } = media;
  const { user } = post;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Post with Sticker</DialogTitle>
            <DialogDescription>
              This post has the "{usage.sticker.title}" sticker attached.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User info */}
            <div className="flex items-center space-x-2">
              <UserAvatar avatarUrl={user.avatarUrl} />
              <div>
                <p className="font-semibold">{user.displayName}</p>
                <Link
                  href={`/users/${user.username}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  @{user.username}
                </Link>
              </div>
            </div>

            {/* Post content */}
            <div className="text-sm">{post.content}</div>

            {/* Media with sticker */}
            <div className="relative rounded-md overflow-hidden border border-border">
              {media.type === "IMAGE" ? (
                <div className="relative aspect-square">
                  <Image
                    src={media.url}
                    alt="Image with sticker"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : media.type === "VIDEO" ? (
                <div className="relative aspect-video">
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Unsupported media type
                </div>
              )}
            </div>

            {/* Post link */}
            <div className="flex justify-end">
              <Link href={`/posts/${post.id}`} target="_blank">
                <Button variant="outline" size="sm">
                  View Full Post
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
