"use client";

import { useState } from "react";
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
import { Pencil, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import debug from "@/lib/debug";

interface NewSticker {
  id: string;
  title: string;
  imageUrl: string;
  position: StickerPosition;
  limit: number | null;
  isActive: boolean;
}

interface PromotionStickersSectionProps {
  onStickersChange?: (stickers: NewSticker[]) => void;
}

export default function PromotionStickersSection({ onStickersChange }: PromotionStickersSectionProps) {
  const { toast } = useToast();
  const [stickers, setStickers] = useState<NewSticker[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<NewSticker | null>(null);

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
  const handleEditClick = (sticker: NewSticker) => {
    setSelectedSticker(sticker);
    setTitle(sticker.title);
    setImageUrl(sticker.imageUrl);
    setPosition(sticker.position);
    setLimit(sticker.limit);
    setIsActive(sticker.isActive);
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (sticker: NewSticker) => {
    setSelectedSticker(sticker);
    setIsDeleteDialogOpen(true);
  };

  // Create a new promotion sticker
  const handleCreate = () => {
    if (!title || !imageUrl || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Create a new sticker with a temporary ID
    const newSticker: NewSticker = {
      id: `temp-${Date.now()}`,
      title,
      imageUrl,
      position: position as StickerPosition,
      limit,
      isActive,
    };

    // Add to stickers array
    const updatedStickers = [...stickers, newSticker];
    setStickers(updatedStickers);

    // Notify parent component if callback exists
    if (onStickersChange) {
      onStickersChange(updatedStickers);
    }

    // Close dialog and reset form
    setIsAddDialogOpen(false);
    resetForm();

    toast({
      title: "Success",
      description: "Sticker added. It will be saved when you create the competition.",
    });
  };

  // Update an existing promotion sticker
  const handleUpdate = () => {
    if (!selectedSticker) return;

    if (!title || !imageUrl || !position) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Update the sticker in the array
    const updatedStickers = stickers.map(sticker =>
      sticker.id === selectedSticker.id
        ? {
          ...sticker,
          title,
          imageUrl,
          position: position as StickerPosition,
          limit,
          isActive,
        }
        : sticker
    );

    setStickers(updatedStickers);

    // Notify parent component if callback exists
    if (onStickersChange) {
      onStickersChange(updatedStickers);
    }

    // Close dialog and reset form
    setIsEditDialogOpen(false);
    resetForm();

    toast({
      title: "Success",
      description: "Sticker updated. Changes will be saved when you create the competition.",
    });
  };

  // Delete a promotion sticker
  const handleDelete = () => {
    if (!selectedSticker) return;

    // Remove the sticker from the array
    const updatedStickers = stickers.filter(sticker => sticker.id !== selectedSticker.id);
    setStickers(updatedStickers);

    // Notify parent component if callback exists
    if (onStickersChange) {
      onStickersChange(updatedStickers);
    }

    // Close dialog and reset form
    setIsDeleteDialogOpen(false);
    resetForm();

    toast({
      title: "Success",
      description: "Sticker removed.",
    });
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
        <Button type="button" onClick={(e) => {
          e.preventDefault();
          setIsAddDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Sticker
        </Button>
      </CardHeader>
      <CardContent>
        {stickers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No promotion stickers added yet. Click "Add New Sticker" to create one.
            <p className="mt-2 text-sm">These stickers will be saved when you create the competition.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Sticker</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Limit</TableHead>
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
                    <TableCell>{sticker.limit ?? "No limit"}</TableCell>
                    <TableCell>
                      <Badge variant={sticker.isActive ? "default" : "secondary"}>
                        {sticker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditClick(sticker);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(sticker);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              These stickers will be saved when you create the competition.
            </div>
          </>
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
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={(e) => {
                e.preventDefault();
                handleCreate();
              }}>
                Create Sticker
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
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={(e) => {
                e.preventDefault();
                handleUpdate();
              }}>
                Update Sticker
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
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}>
                Delete Sticker
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
