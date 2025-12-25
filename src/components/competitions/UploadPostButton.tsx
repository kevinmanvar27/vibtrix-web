"use client";

import { Button } from "@/components/ui/button";
import { Upload, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UploadPostButtonProps {
  competitionId: string;
  isCompleted?: boolean;
}

export default function UploadPostButton({ competitionId, isCompleted = false }: UploadPostButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/competitions/${competitionId}?tab=upload`);
  };

  // Don't render anything if the competition is completed
  if (isCompleted) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      className="min-w-[200px] text-base font-medium px-6 py-6"
      size="lg"
    >
      <Upload className="mr-2 h-4 w-4" />
      Upload Post
    </Button>
  );
}
