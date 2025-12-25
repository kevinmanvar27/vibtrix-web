"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sticker, Sparkles } from "lucide-react";

interface CompetitionSticker {
  competition_stickers: {
    id: string;
    name: string;
    imageUrl: string;
    position: string;
    isDefault: boolean;
  };
}

interface CompetitionStickersProps {
  defaultStickers: CompetitionSticker[];
  optionalStickers: CompetitionSticker[];
}

export function CompetitionStickers({
  defaultStickers,
  optionalStickers
}: CompetitionStickersProps) {
  if (defaultStickers.length === 0 && optionalStickers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sticker className="h-5 w-5 text-purple-500" />
          <CardTitle>Competition Stickers</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Use these stickers to enhance your competition entries
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {defaultStickers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium">Default Stickers</h3>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                Required
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {defaultStickers.map((stickerRelation) => (
                <div
                  key={stickerRelation.competition_stickers.id}
                  className="flex flex-col items-center group"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-white shadow-sm border border-purple-100 dark:border-purple-800 dark:bg-gray-900 p-2 transition-transform group-hover:scale-105">
                    <Image
                      src={stickerRelation.competition_stickers.imageUrl}
                      alt={stickerRelation.competition_stickers.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <span className="text-sm font-medium mt-2">{stickerRelation.competition_stickers.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {optionalStickers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium">Optional Stickers</h3>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                <Sparkles className="h-3 w-3 mr-1" />
                Bonus
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {optionalStickers.map((stickerRelation) => (
                <div
                  key={stickerRelation.competition_stickers.id}
                  className="flex flex-col items-center group"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-white shadow-sm border border-amber-100 dark:border-amber-800 dark:bg-gray-900 p-2 transition-transform group-hover:scale-105">
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 z-10"></div>
                    <Image
                      src={stickerRelation.competition_stickers.imageUrl}
                      alt={stickerRelation.competition_stickers.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                  <span className="text-sm font-medium mt-2">{stickerRelation.competition_stickers.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
