"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { StickerPosition } from "@prisma/client";
import { Plus, Pencil, Trash2, Image, Loader2 } from "lucide-react";
import DirectStickerUploader from "@/components/admin/DirectStickerUploader";
import NextImage from "next/image";
import { Badge } from "@/components/ui/badge";
import debug from "@/lib/debug";

interface FeedSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CompetitionFeedStickersFormProps {
  competitionId: string;
  feedStickers: FeedSticker[];
}

export function CompetitionFeedStickersForm({ 
  competitionId,
  feedStickers: initialStickers 
}: CompetitionFeedStickersFormProps) {
  const { toast } = useToast();
  const [stickers, setStickers] = useState<FeedSticker[]>(initialStickers || []);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStickerId, setCurrentStickerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [position, setPosition] = useState<StickerPosition | "">("");
  const [limit, setLimit] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Position labels for display
  const positionLabels: Record<StickerPosition, string> = {
    TOP_LEFT: "Top Left",
    TOP_RIGHT: "Top Right",
    BOTTOM_LEFT: "Bottom Left",
    BOTTOM_RIGHT: "Bottom Right",
    CENTER: "Center",
  };

  // Fetch stickers on component mount
  useEffect(() => {
    if (initialStickers && initialStickers.length > 0) {
      setStickers(initialStickers);
    } else {
      fetchStickers();
    }
  }, [initialStickers]);

  // Fetch stickers from the API
  const fetchStickers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}/feed-stickers`);

      if (!response.ok) {
        throw new Error("Failed to fetch competition feed stickers");
      }

      const data = await response.json();
      setStickers(data.stickers || []);
    } catch (error) {
      debug.error("Error fetching competition feed stickers:", error);
      toast({
        title: "Error",
        description: "Failed to load feed stickers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setTitle("");
    setImageUrl("");
    setPosition("");
    setLimit(null);
    setIsActive(true);
    setCurrentStickerId(null);
    setIsEditing(false);
  };

  // Open dialog for creating a new sticker
  const handleAddClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing an existing sticker
  const handleEditClick = (sticker: FeedSticker) => {
    setTitle(sticker.title);
    setImageUrl(sticker.imageUrl);
    setPosition(sticker.position);
    setLimit(sticker.limit);
    setIsActive(sticker.isActive);
    setCurrentStickerId(sticker.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !position) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing
        ? `/api/competitions/${competitionId}/feed-stickers/${currentStickerId}`
        : `/api/competitions/${competitionId}/feed-stickers`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl,
          position,
          limit: limit || null,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save sticker");
      }

      const data = await response.json();
      
      if (isEditing) {
        // Update the sticker in the list
        setStickers(stickers.map(s => s.id === currentStickerId ? data.sticker : s));
      } else {
        // Add the new sticker to the list
        setStickers([data.sticker, ...stickers]);
      }

      setIsDialogOpen(false);
      resetForm();

      toast({
        title: "Success",
        description: isEditing
          ? "Sticker updated successfully"
          : "Sticker created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save sticker",
        variant: "destructive",
      });
      debug.error("Error saving competition feed sticker:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle sticker deletion
  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/competitions/${competitionId}/feed-stickers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete sticker");
      }

      // Remove the sticker from the list
      setStickers(stickers.filter(s => s.id !== id));

      toast({
        title: "Success",
        description: "Sticker deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete sticker",
        variant: "destructive",
      });
      debug.error("Error deleting competition feed sticker:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Competition Feed Stickers
          </CardTitle>
          <CardDescription>
            Manage stickers that can be applied to media in the competition feed
          </CardDescription>
        </div>
        <Button onClick={handleAddClick} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Sticker
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">No Feed Stickers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add stickers to be applied to media in the competition feed
            </p>
            <Button onClick={handleAddClick} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Sticker
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sticker</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stickers.map((sticker) => (
                  <TableRow key={sticker.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-white p-1">
                        <NextImage
                          src={sticker.imageUrl}
                          alt={sticker.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{sticker.title}</TableCell>
                    <TableCell>{positionLabels[sticker.position]}</TableCell>
                    <TableCell>{sticker.limit || "Unlimited"}</TableCell>
                    <TableCell>
                      {sticker.isActive ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(sticker)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sticker.id)}
                          disabled={isDeleting && deleteId === sticker.id}
                        >
                          {isDeleting && deleteId === sticker.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Feed Sticker" : "Add Feed Sticker"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update the details of this feed sticker"
                  : "Create a new sticker to be applied to media in the competition feed"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Sticker Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter sticker title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={position}
                    onValueChange={(value) => setPosition(value as StickerPosition)}
                    required
                  >
                    <SelectTrigger id="position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="limit">Usage Limit (optional)</Label>
                  <Input
                    id="limit"
                    type="number"
                    min="1"
                    value={limit || ""}
                    onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum number of times this sticker can be used
                  </p>
                </div>

                <div>
                  <Label htmlFor="sticker-image">Sticker Image</Label>
                  <div className="mt-2">
                    <DirectStickerUploader
                      onUploadComplete={handleImageUpload}
                      existingImageUrl={imageUrl}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Sticker"
                  ) : (
                    "Create Sticker"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
