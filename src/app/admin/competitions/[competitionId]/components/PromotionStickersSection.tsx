"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { StickerPosition } from "@prisma/client";
import DirectStickerUploader from "@/components/admin/DirectStickerUploader";
import Image from "next/image";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StickerUsageView from "./StickerUsageView";

import debug from "@/lib/debug";

interface PromotionSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
  competitionId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
  };
  usages?: {
    isDeleted: boolean;
  }[];
}

interface PromotionStickersSectionProps {
  competitionId?: string;
  isNewCompetition?: boolean;
}

export default function PromotionStickersSection({ competitionId, isNewCompetition = false }: PromotionStickersSectionProps) {
  const { toast } = useToast();
  const [stickers, setStickers] = useState<PromotionSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<PromotionSticker | null>(null);

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
    if (competitionId && !isNewCompetition) {
      fetchStickers();
    }
  }, [competitionId, isNewCompetition]);

  // Fetch all promotion stickers for this competition
  const fetchStickers = async () => {
    if (!competitionId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/competitions/${competitionId}/promotion-stickers?includeUsage=true`);

      if (!response.ok) {
        throw new Error("Failed to fetch promotion stickers");
      }

      const data = await response.json();
      setStickers(data);
    } catch (error) {
      debug.error("Error fetching promotion stickers:", error);
      toast({
        title: "Error",
        description: "Failed to load promotion stickers. Please try again.",
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
  const handleEditClick = (sticker: PromotionSticker) => {
    setSelectedSticker(sticker);
    setTitle(sticker.title);
    setImageUrl(sticker.imageUrl);
    setPosition(sticker.position);
    setLimit(sticker.limit);
    setIsActive(sticker.isActive);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (sticker: PromotionSticker) => {
    setSelectedSticker(sticker);
    setIsDeleteDialogOpen(true);
  };

  // Create a new promotion sticker
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
      const response = await fetch(`/api/competitions/${competitionId}/promotion-stickers`, {
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
        throw new Error("Failed to create promotion sticker");
      }

      toast({
        title: "Success",
        description: "Promotion sticker created successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error creating promotion sticker:", error);
      toast({
        title: "Error",
        description: "Failed to create promotion sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Update an existing promotion sticker
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
      const response = await fetch(`/api/competitions/${competitionId}/promotion-stickers/${selectedSticker.id}`, {
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
        throw new Error("Failed to update promotion sticker");
      }

      toast({
        title: "Success",
        description: "Promotion sticker updated successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error updating promotion sticker:", error);
      toast({
        title: "Error",
        description: "Failed to update promotion sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a promotion sticker
  const handleDelete = async () => {
    if (!selectedSticker) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/competitions/${competitionId}/promotion-stickers/${selectedSticker.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete promotion sticker");
      }

      toast({
        title: "Success",
        description: "Promotion sticker deleted successfully.",
      });

      // Refresh stickers list
      fetchStickers();

      // Close dialog and reset form
      setIsDeleteDialogOpen(false);
      resetForm();
    } catch (error) {
      debug.error("Error deleting promotion sticker:", error);
      toast({
        title: "Error",
        description: "Failed to delete promotion sticker. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Form dialog content (shared between add and edit)
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
            min="0"
            value={limit === null ? "" : limit}
            onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : null)}
            className="col-span-3"
            placeholder="Optional"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isActive" className="text-right">
            Active
          </Label>
          <div className="col-span-3 flex items-center">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Image</Label>
          <div className="col-span-3">
            {imageUrl ? (
              <div className="relative h-32 w-32 mx-auto">
                <Image
                  src={imageUrl}
                  alt={title || "Sticker preview"}
                  fill
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Promotion Stickers</CardTitle>
        {isNewCompetition ? (
          <div className="text-sm text-muted-foreground">
            Save the competition first to add promotion stickers
          </div>
        ) : (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Sticker
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isNewCompetition ? (
          <div className="text-center py-4 text-muted-foreground">
            You can add promotion stickers after creating the competition.
          </div>
        ) : loading ? (
          <div className="text-center py-4">Loading stickers...</div>
        ) : stickers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No promotion stickers found. Click "Add New Sticker" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Sticker</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stickers.map((sticker) => (
                <TableRow key={sticker.id}>
                  <TableCell>{sticker.title}</TableCell>
                  <TableCell>
                    <div className="relative h-12 w-12">
                      <Image
                        src={sticker.imageUrl}
                        alt={sticker.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{positionLabels[sticker.position]}</TableCell>
                  <TableCell>
                    {sticker._count ? (
                      <span className={sticker.limit && (sticker._count.usages - (sticker.usages?.filter(u => u.isDeleted).length || 0)) >= (sticker.limit || 0) ? "text-destructive font-bold" : ""}>
                        {sticker._count.usages - (sticker.usages?.filter(u => u.isDeleted).length || 0)}/{sticker.limit || "∞"}
                      </span>
                    ) : (
                      sticker.limit ? "0/" + sticker.limit : "No limit"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sticker.isActive ? "default" : "secondary"}>
                      {sticker.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <StickerUsageView stickerId={sticker.id} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(sticker)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(sticker)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Sticker Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Promotion Sticker</DialogTitle>
              <DialogDescription>
                Create a new promotion sticker for this competition.
              </DialogDescription>
            </DialogHeader>
            {renderFormContent()}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Sticker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Sticker Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Promotion Sticker</DialogTitle>
              <DialogDescription>
                Update the details of this promotion sticker.
              </DialogDescription>
            </DialogHeader>
            {renderFormContent()}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? "Updating..." : "Update Sticker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this promotion sticker? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting ? "Deleting..." : "Delete Sticker"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
