"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CompetitionForm from "./CompetitionForm";
import PromotionStickersSection from "./PromotionStickersSection";
import { PromotionStickerData } from "../actions";

export default function NewCompetitionForm() {
  const [stickers, setStickers] = useState<PromotionStickerData[]>([]);
  const competitionFormRef = useRef<any>(null);

  // Function to handle stickers from PromotionStickersSection
  const handleStickersChange = (newStickers: any[]) => {
    setStickers(newStickers);

    // Pass stickers to CompetitionForm if ref is available
    if (competitionFormRef.current && competitionFormRef.current.handlePromotionStickers) {
      competitionFormRef.current.handlePromotionStickers(newStickers);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competition Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionForm ref={competitionFormRef} />
        </CardContent>
      </Card>

      <PromotionStickersSection onStickersChange={handleStickersChange} />
    </div>
  );
}
