"use client";

import { useState } from "react";
import CustomImage from "@/components/ui/CustomImage";
import { Trash2, Eye, MessageSquare, Share2, Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DeleteEntryDialog from "./DeleteEntryDialog";
import VideoWithSticker from "./VideoWithSticker";
import ImageWithSticker from "./ImageWithSticker";
import { StickerPosition } from "@prisma/client";
import MediaPreviews from "@/components/posts/MediaPreviews";
import UserAvatar from "@/components/UserAvatar";
import { useSession } from "@/app/(main)/SessionProvider";
import Linkify from "@/components/Linkify";
import AddStickerButton from "./AddStickerButton";

import debug from "@/lib/debug";

interface RoundPostPreviewProps {
  post: {
    id: string;
    content: string;
    attachments: Array<{
      id: string;
      url: string;
      type: 'IMAGE' | 'VIDEO';
      appliedPromotionStickerId?: string | null;
      appliedPromotionSticker?: {
        id: string;
        imageUrl: string;
        position: StickerPosition;
      } | null;
    }>;
    user?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      onlineStatus: string;
    };
    createdAt?: Date;
  };
  competitionId: string;
  roundId: string;
  roundName: string;
  roundStarted: boolean;
  roundEnded?: boolean;
  onDeleted: () => void;
  onUploadClick?: () => void;
}

export default function RoundPostPreview({
  post,
  competitionId,
  roundId,
  roundName,
  roundStarted,
  roundEnded = false,
  onDeleted
}: RoundPostPreviewProps) {
  const { user } = useSession();
  // Initialize previewOpen to false so the dialog doesn't open automatically
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  // Create a mock like state for the preview
  const likeInfo = {
    likes: 0,
    isLikedByUser: false,
  };

  return (
    <div className="space-y-3">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-2">
        {roundEnded && (
          <div className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-muted-foreground">
            Round Completed
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none shadow-md"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>

          {!roundStarted && !roundEnded && (
            <>
              <AddStickerButton
                competitionId={competitionId}
                postId={post.id}
                onStickerAdded={() => window.location.reload()}
              />
              <Button
                size="sm"
                variant="destructive"
                className="border-none shadow-md"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Delete dialog */}
      <DeleteEntryDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        competitionId={competitionId}
        roundId={roundId}
        roundName={roundName}
        onDeleted={onDeleted}
      />

      {/* Display each attachment in its own row */}
      <div className="space-y-3">
        {post.attachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className="relative group overflow-hidden rounded-lg border border-border bg-card/50 hover:bg-card transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="relative aspect-video w-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10"></div>
              {attachment.type === 'IMAGE' ? (
                // For images, use ImageWithSticker if there's a sticker applied
                <div className="relative w-full h-full">
                  {attachment.appliedPromotionStickerId && attachment.appliedPromotionSticker ? (
                    <ImageWithSticker
                      imageSrc={attachment.url}
                      stickerSrc={attachment.appliedPromotionSticker.imageUrl}
                      stickerPosition={attachment.appliedPromotionSticker.position}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      alt={`Media ${index + 1}`}
                    />
                  ) : (
                    <CustomImage
                      src={attachment.url}
                      alt={`Media ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
              ) : (
                // For videos, use VideoWithSticker if there's a sticker applied
                <div className="relative w-full h-full bg-black">
                  {attachment.appliedPromotionStickerId && attachment.appliedPromotionSticker ? (
                    <VideoWithSticker
                      videoSrc={attachment.url}
                      stickerSrc={attachment.appliedPromotionSticker.imageUrl}
                      stickerPosition={attachment.appliedPromotionSticker.position}
                      className="absolute inset-0 w-full h-full object-cover"
                      controls={false}
                      muted={true}
                      key={`preview-video-${attachment.id}`}
                    />
                  ) : (
                    <>
                      <video
                        src={attachment.url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        onError={(e) => {
                          debug.error('Failed to load video:', e);
                          // Add fallback or error state if needed
                        }}
                        key={`preview-video-${attachment.id}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Media number indicator */}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full shadow-sm z-20 backdrop-blur-sm">
              Media {index + 1} of {post.attachments.length}
            </div>
          </div>
        ))}
      </div>

      {/* Caption preview if exists */}
      {post.content && (
        <div className="p-4 border border-border rounded-lg bg-card shadow-sm">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Caption
          </h4>
          <div className="max-h-[100px] overflow-y-auto">
            <p className="text-sm text-foreground">{post.content}</p>
          </div>
        </div>
      )}

      {/* Full preview dialog - only rendered when previewOpen is true */}
      {previewOpen && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-base">{roundName} Entry Preview</DialogTitle>
            </DialogHeader>

            <article className="group/post space-y-2 rounded-xl bg-card p-3 shadow-sm border border-border/30">
              {/* User info header */}
              <div className="flex justify-between gap-3">
                <div className="flex flex-wrap gap-3">
                  <UserAvatar
                    avatarUrl={post.user?.avatarUrl || null}
                    showStatus={true}
                    status={post.user?.onlineStatus || 'OFFLINE'}
                    statusSize="sm"
                    size={32}
                  />
                  <div>
                    <div className="block font-medium text-sm">
                      {post.user?.displayName || 'Your Entry'}
                    </div>
                    <div className="block text-xs text-muted-foreground">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Preview'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Post content */}
              {post.content && (
                <div className="whitespace-pre-line break-words text-sm">
                  <Linkify>{post.content}</Linkify>
                </div>
              )}

              {/* Media attachments */}
              {!!post.attachments.length && (
                <div className="mt-1 mb-1">
                  {/* Custom media display for preview */}
                  <div className="relative rounded-lg overflow-hidden bg-black/5 border border-border/20" style={{ aspectRatio: '1/1' }}>
                    {post.attachments[currentAttachmentIndex].type === 'IMAGE' ? (
                      <div className="w-full h-full relative">
                        {post.attachments[currentAttachmentIndex].appliedPromotionStickerId &&
                         post.attachments[currentAttachmentIndex].appliedPromotionSticker ? (
                          <ImageWithSticker
                            imageSrc={post.attachments[currentAttachmentIndex].url}
                            stickerSrc={post.attachments[currentAttachmentIndex].appliedPromotionSticker.imageUrl}
                            stickerPosition={post.attachments[currentAttachmentIndex].appliedPromotionSticker.position}
                            fill
                            className="object-contain"
                            alt={`Media ${currentAttachmentIndex + 1}`}
                          />
                        ) : (
                          <CustomImage
                            src={post.attachments[currentAttachmentIndex].url}
                            alt={`Media ${currentAttachmentIndex + 1}`}
                            fill
                            className="object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        {post.attachments[currentAttachmentIndex].appliedPromotionStickerId &&
                         post.attachments[currentAttachmentIndex].appliedPromotionSticker ? (
                          <VideoWithSticker
                            videoSrc={post.attachments[currentAttachmentIndex].url}
                            stickerSrc={post.attachments[currentAttachmentIndex].appliedPromotionSticker.imageUrl}
                            stickerPosition={post.attachments[currentAttachmentIndex].appliedPromotionSticker.position}
                            className="w-full h-full object-contain"
                            controls={true}
                          />
                        ) : (
                          <video
                            src={post.attachments[currentAttachmentIndex].url}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    )}

                    {/* Media counter indicator */}
                    {post.attachments.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full shadow-sm z-20 backdrop-blur-sm">
                        {currentAttachmentIndex + 1} of {post.attachments.length}
                      </div>
                    )}
                  </div>

                  {/* Navigation dots for multiple attachments */}
                  {post.attachments.length > 1 && (
                    <div className="flex justify-center gap-2 mt-2">
                      {post.attachments.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${index === currentAttachmentIndex ? 'bg-primary scale-125' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                          onClick={() => setCurrentAttachmentIndex(index)}
                          aria-label={`View image ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interaction buttons */}
              <hr className="text-muted-foreground my-1" />
              <div className="flex justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs">0</span>
                  </button>
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-xs">0</span>
                  </button>
                  <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="text-xs">0</span>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>
            </article>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
