"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ExternalLink } from "lucide-react";
import debug from "@/lib/debug";
import { useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StickerUsageViewProps {
  stickerId: string;
}

interface StickerUsage {
  id: string;
  stickerId: string;
  mediaUrl: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  media?: {
    id: string;
    type: "IMAGE" | "VIDEO";
    url: string;
    post?: {
      id: string;
      content: string;
      user: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
      };
    };
  };
}

export default function StickerUsageView({ stickerId }: StickerUsageViewProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usages, setUsages] = useState<StickerUsage[]>([]);

  // Fetch sticker usage data when dialog opens
  const fetchStickerUsages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stickers/${stickerId}/usages`);

      if (!response.ok) {
        throw new Error("Failed to fetch sticker usages");
      }

      const data = await response.json();
      setUsages(data);
    } catch (error) {
      debug.error("Error fetching sticker usages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => {
        setOpen(true);
        fetchStickerUsages();
      }}>
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Sticker Usage Details</DialogTitle>
            <DialogDescription>
              View posts where this sticker has been applied
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-center py-8">Loading sticker usage data...</div>
          ) : usages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              This sticker hasn't been used on any posts yet.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Sr No.</TableHead>
                    <TableHead className="w-[80px]">Profile</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Post URL</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((usage, index) => {
                    if (!usage.media?.post) return null;

                    const { post } = usage.media;
                    const postUrl = `/posts/${post.id}`;

                    return (
                      <TableRow key={usage.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <UserAvatar
                            avatarUrl={post.user.avatarUrl}
                            className="h-8 w-8"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{post.user.displayName}</span>
                            <span className="text-xs text-muted-foreground">@{post.user.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[200px]">
                          {postUrl}
                        </TableCell>
                        <TableCell>
                          <Link href={postUrl} target="_blank">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
