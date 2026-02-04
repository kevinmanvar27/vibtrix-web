"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StickerPosition } from "@prisma/client";
import { Plus, Pencil, Trash2, Image } from "lucide-react";
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

interface FeedStickersFormProps {
  // Add props if needed
}

export function FeedStickersForm({}: FeedStickersFormProps) {
  const { toast } = useToast();
  const [stickers, setStickers] = useState<FeedSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<FeedSticker | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [position, setPosition] = useState<StickerPosition | "">("");
  const [limit, setLimit] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(true);

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
    fetchStickers();
  }, []);

  // Fetch stickers from the API
  const fetchStickers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/feed-stickers");

      if (!response.ok) {
        throw new Error("Failed to fetch feed stickers");
      }

      const data = await response.json();
      setStickers(data.stickers || []);
    } catch (error) {
      debug.error("Error fetching feed stickers:", error);
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
    setSelectedSticker(null);
  };

  // Open edit dialog and populate form
  const handleEditClick = (sticker: FeedSticker) => {
    setSelectedSticker(sticker);
    setTitle(sticker.title);
    setImageUrl(sticker.imageUrl);
    setPosition(sticker.position);
    setLimit(sticker.limit);
    setIsActive(sticker.isActive);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (sticker: FeedSticker) => {
    setSelectedSticker(sticker);
    setIsDeleteDialogOpen(true);
  };

  // Create a new feed sticker
  const handleCreate = async () => {
    if (!title || !imageUrl || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/feed-stickers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl,
          position,
          limit,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create feed sticker");
      }

      toast({
        title: "Success",
        description: "Feed sticker created successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error creating feed sticker:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create feed sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update an existing feed sticker
  const handleUpdate = async () => {
    if (!selectedSticker) return;

    if (!title || !imageUrl || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/feed-stickers/${selectedSticker.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          imageUrl,
          position,
          limit,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update feed sticker");
      }

      toast({
        title: "Success",
        description: "Feed sticker updated successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error updating feed sticker:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update feed sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a feed sticker
  const handleDelete = async () => {
    if (!selectedSticker) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/feed-stickers/${selectedSticker.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete feed sticker");
      }

      toast({
        title: "Success",
        description: "Feed sticker deleted successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error deleting feed sticker:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete feed sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Render form dialog content
  const renderFormContent = () => (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="position" className="text-right">
            Position
          </Label>
          <Select
            value={position}
            onValueChange={(value) => setPosition(value as StickerPosition)}
          >
            <SelectTrigger className="col-span-3">
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="limit" className="text-right">
            Limit
          </Label>
          <Input
            id="limit"
            type="number"
            value={limit === null ? "" : limit}
            onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="No limit"
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isActive" className="text-right">
            Active
          </Label>
          <div className="flex items-center space-x-2 col-span-3">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <span className="text-sm text-muted-foreground">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Image</Label>
          <div className="col-span-3">
            {imageUrl ? (
              <div className="relative h-32 w-32 mx-auto">
                <NextImage
                  src={imageUrl}
                  alt={title || "Sticker preview"}
                  fill
                  sizes="128px"
                  className="object-contain"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2"
                  onClick={() => setImageUrl("")}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <DirectStickerUploader
                onUploadComplete={(url) => {
                  debug.log('Sticker uploaded successfully:', url);
                  setImageUrl(url);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Feed Stickers
          </CardTitle>
          <CardDescription>
            Manage stickers that can be applied to feed media
          </CardDescription>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Sticker
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading stickers...</p>
          </div>
        ) : stickers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted/10 rounded-lg border border-dashed border-muted">
            <div className="p-3 rounded-full bg-muted/30">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No feed stickers found.</p>
              <p className="text-sm text-muted-foreground">
                Click "Add New Sticker" to create one.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Sticker</TableHead>
                  <TableHead className="font-semibold">Position</TableHead>
                  <TableHead className="font-semibold">Limit</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stickers.map((sticker) => (
                  <TableRow key={sticker.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{sticker.title}</TableCell>
                    <TableCell>
                      <div className="relative h-14 w-14 bg-muted/20 rounded-md p-1">
                        <NextImage
                          src={sticker.imageUrl}
                          alt={sticker.title}
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{positionLabels[sticker.position]}</TableCell>
                    <TableCell>{sticker.limit ?? "No limit"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={sticker.isActive ? "default" : "secondary"}
                        className={sticker.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {sticker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(sticker)}
                          className="h-8 w-8 p-0 border-primary/30 hover:border-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(sticker)}
                          className="h-8 w-8 p-0 border-red-300 hover:border-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Sticker Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              Add New Feed Sticker
            </DialogTitle>
            <DialogDescription>
              Create a new sticker that will be applied to feed media
            </DialogDescription>
          </DialogHeader>
          {renderFormContent()}
          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
              className="border-muted-foreground/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Sticker"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sticker Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Feed Sticker
            </DialogTitle>
            <DialogDescription>
              Update the sticker details and configuration
            </DialogDescription>
          </DialogHeader>
          {renderFormContent()}
          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="border-muted-foreground/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Sticker"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sticker Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Feed Sticker
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sticker? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSticker && (
            <div className="flex items-center gap-4 p-4 my-4 rounded-lg bg-muted/20 border">
              <div className="relative h-16 w-16 bg-muted/20 rounded-md p-1">
                <NextImage
                  src={selectedSticker.imageUrl}
                  alt={selectedSticker.title}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <h3 className="font-medium">{selectedSticker.title}</h3>
                <p className="text-sm text-muted-foreground">Position: {positionLabels[selectedSticker.position]}</p>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                resetForm();
              }}
              className="border-muted-foreground/30"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Sticker"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
