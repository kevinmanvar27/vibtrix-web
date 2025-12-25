"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { X, Plus, Upload, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DirectStickerUploader from "@/components/admin/DirectStickerUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import debug from "@/lib/debug";

// Define the corner positions
export enum CornerPosition {
  TOP_LEFT = "TOP_LEFT",
  TOP_RIGHT = "TOP_RIGHT",
  BOTTOM_LEFT = "BOTTOM_LEFT",
  BOTTOM_RIGHT = "BOTTOM_RIGHT"
}

// Sticker type
export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
}

// Placed sticker type
export interface PlacedSticker {
  stickerId: string;
  position: CornerPosition;
  limit?: number;
}

interface PosterStickerManagerProps {
  stickers: Sticker[];
  placedStickers: PlacedSticker[];
  onStickerPlaced: (sticker: Sticker, position: CornerPosition, limit?: number) => void;
  onStickerRemoved: (position: CornerPosition) => void;
  onStickerCreated: (sticker: Sticker) => void;
}

export default function PosterStickerManager({
  stickers,
  placedStickers: initialPlacedStickers,
  onStickerPlaced,
  onStickerRemoved,
  onStickerCreated
}: PosterStickerManagerProps) {
  const { toast } = useToast();
  const [newStickerName, setNewStickerName] = useState("");
  const [newStickerUrl, setNewStickerUrl] = useState("");
  const [newStickerCorner, setNewStickerCorner] = useState<CornerPosition>(CornerPosition.TOP_LEFT);
  const [newStickerLimit, setNewStickerLimit] = useState(1);
  const [isAddingSticker, setIsAddingSticker] = useState(false);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>(initialPlacedStickers);


  // Get sticker by ID
  const getStickerById = (id: string): Sticker | undefined => {
    return stickers.find(s => s.id === id);
  };

  // Get sticker for a position
  const getStickerForPosition = (position: CornerPosition): PlacedSticker | undefined => {
    return placedStickers.find(s => s.position === position);
  };



  // Handle sticker addition
  const handleAddSticker = () => {
    if (!newStickerName || !newStickerUrl) {
      toast({
        title: "Missing information",
        description: "Please provide a name and upload an image for the sticker.",
        variant: "destructive"
      });
      return;
    }

    // Create a new sticker
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`, // Generate a temporary ID
      name: newStickerName,
      imageUrl: newStickerUrl
    };

    // Call the parent handler to create the sticker
    onStickerCreated(newSticker);

    // Create a placed sticker with the selected corner and limit
    const newPlacedSticker: PlacedSticker = {
      stickerId: newSticker.id,
      position: newStickerCorner,
      limit: newStickerLimit
    };

    // Add to placed stickers
    const newPlacedStickers = [...placedStickers, newPlacedSticker];
    setPlacedStickers(newPlacedStickers);

    // Notify parent component
    onStickerPlaced(newSticker, newStickerCorner, newStickerLimit);

    // Reset form
    setNewStickerName("");
    setNewStickerUrl("");
    setNewStickerLimit(1);
    setIsAddingSticker(false);

    toast({
      title: "Sticker added",
      description: `${newSticker.name} added to the sticker collection.`
    });
  };

  // Position labels for display
  const positionLabels: Record<CornerPosition, string> = {
    TOP_LEFT: "Top Left",
    TOP_RIGHT: "Top Right",
    BOTTOM_LEFT: "Bottom Left",
    BOTTOM_RIGHT: "Bottom Right"
  };

  return (
    <div className="space-y-6">


      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Promotional Stickers</h3>
          <p className="text-sm text-muted-foreground">
            Configure stickers that will be attached to user posts.
          </p>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium">Sticker Placement Rules</h4>
              <p className="text-sm text-muted-foreground">
                Configure which stickers appear in each corner and set individual usage limits.
              </p>
            </div>
          </div>

          <Table className="border shadow-sm rounded-md overflow-hidden">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Sticker</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Corner</TableHead>
                <TableHead className="font-semibold">Limit</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Add new sticker row */}
              <TableRow className="bg-muted/20 hover:bg-muted/30">
                <TableCell>
                  <div className="flex justify-center">
                    {newStickerUrl ? (
                      <div className="relative h-16 w-16 rounded-md overflow-hidden border bg-background">
                        <Image
                          src={newStickerUrl}
                          alt={newStickerName || "Sticker preview"}
                          fill
                          className="object-contain p-1"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setNewStickerUrl("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <DirectStickerUploader
                          onUploadComplete={(url) => {
                            debug.log('Sticker uploaded successfully:', url);
                            setNewStickerUrl(url);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Sticker name"
                    value={newStickerName}
                    onChange={(e) => setNewStickerName(e.target.value)}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newStickerCorner}
                    onValueChange={(value) => setNewStickerCorner(value as CornerPosition)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select corner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CornerPosition).map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {positionLabels[pos]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="w-20"
                      value={newStickerLimit}
                      onChange={(e) => setNewStickerLimit(parseInt(e.target.value) || 1)}
                    />
                    <span className="text-sm text-muted-foreground">uses</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    onClick={handleAddSticker}
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!newStickerName || !newStickerUrl}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </TableCell>
              </TableRow>

              {/* Existing stickers */}
              {placedStickers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No stickers added yet. Add a sticker using the form above.
                  </TableCell>
                </TableRow>
              ) : (
                placedStickers.map((placedSticker, index) => {
                  const sticker = getStickerById(placedSticker.stickerId);
                  if (!sticker) return null;

                  return (
                    <TableRow key={`${placedSticker.stickerId}-${placedSticker.position}`} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex justify-center">
                          <div className="relative h-12 w-12 rounded-md overflow-hidden border bg-background">
                            <Image
                              src={sticker.imageUrl}
                              alt={sticker.name}
                              fill
                              className="object-contain p-1"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{sticker.name}</p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={placedSticker.position}
                          onValueChange={(value) => {
                            const newPlacedStickers = [...placedStickers];
                            newPlacedStickers[index].position = value as CornerPosition;
                            setPlacedStickers(newPlacedStickers);
                            onStickerRemoved(CornerPosition.TOP_LEFT); // Trigger update
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select corner" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(CornerPosition).map((pos) => (
                              <SelectItem key={pos} value={pos}>
                                {positionLabels[pos]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className="w-20"
                            value={placedSticker.limit || 1}
                            onChange={(e) => {
                              const newPlacedStickers = [...placedStickers];
                              newPlacedStickers[index].limit = parseInt(e.target.value) || 1;
                              setPlacedStickers(newPlacedStickers);
                              onStickerRemoved(CornerPosition.TOP_LEFT); // Trigger update
                            }}
                          />
                          <span className="text-sm text-muted-foreground">uses</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => {
                              // Edit functionality could be added here
                              toast({
                                title: "Edit sticker",
                                description: "Edit functionality to be implemented."
                              });
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => {
                              const newPlacedStickers = placedStickers.filter((_, i) => i !== index);
                              setPlacedStickers(newPlacedStickers);
                              onStickerRemoved(CornerPosition.TOP_LEFT); // Trigger update
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>



      {/* No dialog needed anymore as we're using inline form */}


    </div>
  );
}
