"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Edit, Eye, MoreHorizontal, Trash, Play, Pause, Plus, Megaphone, ImageIcon, Video } from "lucide-react";
import Link from "next/link";
import { AdvertisementStatus, MediaType } from "@prisma/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { deleteAdvertisement, toggleAdvertisementStatus } from "@/app/admin/advertisements/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import Image from "next/image";
import { cn } from "@/lib/utils";

import debug from "@/lib/debug";

type Advertisement = {
  id: string;
  title: string;
  adType: MediaType;
  skipDuration: number;
  displayFrequency: number;
  scheduleDate: Date;
  expiryDate: Date;
  status: AdvertisementStatus;
  url?: string | null;
  competitionId?: string | null;
  media: {
    id: string;
    url: string;
    type: MediaType;
  };
};

interface CompetitionAdvertisementTableProps {
  advertisements: Advertisement[];
  competitionId: string;
}

export default function CompetitionAdvertisementTable({
  advertisements,
  competitionId,
}: CompetitionAdvertisementTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [processingAdId, setProcessingAdId] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ url: string; title: string; type: "IMAGE" | "VIDEO" } | null>(null);

  const getStatusBadge = (status: AdvertisementStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "PAUSED":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Paused</Badge>;
      case "SCHEDULED":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">Scheduled</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this advertisement? This action cannot be undone.")) {
      setProcessingAdId(id);
      try {
        await deleteAdvertisement(id);
        toast({
          title: "Advertisement deleted",
          description: "The advertisement has been successfully deleted.",
        });
        router.refresh();
      } catch (error: any) {
        debug.error(error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete advertisement. Please try again.",
          variant: "destructive",
        });
      } finally {
        setProcessingAdId(null);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: AdvertisementStatus) => {
    setProcessingAdId(id);
    try {
      const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
      await toggleAdvertisementStatus(id, newStatus);
      toast({
        title: newStatus === "ACTIVE" ? "Advertisement activated" : "Advertisement paused",
        description: `The advertisement has been ${newStatus === "ACTIVE" ? "activated" : "paused"} successfully.`,
      });
      router.refresh();
    } catch (error: any) {
      debug.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to update advertisement status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingAdId(null);
    }
  };

  const handlePreviewMedia = (ad: Advertisement) => {
    setVideoPreview({
      url: ad.media.url,
      title: ad.title,
      type: ad.adType,
    });
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Advertisements</h3>
        <Button asChild>
          <Link href={`/admin/competitions/${competitionId}/advertisements/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Advertisement
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="text-center w-36">Media</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Skip Duration</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advertisements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <p>No advertisements found for this competition</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/competitions/${competitionId}/advertisements/create`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Advertisement
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            advertisements.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.title}</TableCell>
                <TableCell className="text-center p-4">
                  <div className="flex items-center justify-center mx-auto">
                    {ad.media && ad.adType === "IMAGE" ? (
                      <div
                        className="relative w-32 h-16 rounded-xl overflow-hidden cursor-pointer border inline-block shadow-sm hover:shadow-md transition-shadow bg-white p-2"
                        onClick={() => handlePreviewMedia(ad)}
                      >
                        <Image
                          src={ad.media.url.startsWith('/') ? ad.media.url : `/${ad.media.url}`}
                          alt={ad.title}
                          fill
                          className="object-contain object-center"
                          sizes="128px"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="relative w-32 h-16 rounded-xl overflow-hidden cursor-pointer bg-white flex items-center justify-center border inline-block shadow-sm hover:shadow-md transition-shadow p-2"
                        onClick={() => handlePreviewMedia(ad)}
                      >
                        <Video className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>Every {ad.displayFrequency} posts</TableCell>
                <TableCell>{ad.skipDuration} seconds</TableCell>
                <TableCell>{format(ad.scheduleDate, "PPP")}</TableCell>
                <TableCell>{format(ad.expiryDate, "PPP")}</TableCell>
                <TableCell>{getStatusBadge(ad.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={processingAdId === ad.id}
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={ad.id ? `/admin/competitions/${competitionId}/advertisements/${ad.id}` : '#'}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={ad.id ? `/admin/competitions/${competitionId}/advertisements/${ad.id}/edit` : '#'}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Advertisement
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {ad.status !== "EXPIRED" && (
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(ad.id, ad.status)}
                          disabled={processingAdId === ad.id}
                        >
                          {ad.status === "ACTIVE" ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Advertisement
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Activate Advertisement
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(ad.id)}
                        disabled={processingAdId === ad.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Advertisement
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Media Preview Dialog */}
      <Dialog open={!!videoPreview} onOpenChange={(open) => !open && setVideoPreview(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{videoPreview?.title}</DialogTitle>
            <DialogDescription>
              Advertisement preview
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {videoPreview?.type === "IMAGE" ? (
              <div className="relative w-full aspect-video rounded-md overflow-hidden">
                <Image
                  src={(videoPreview?.url && videoPreview.url.startsWith('/'))
                    ? videoPreview.url
                    : (videoPreview?.url ? `/${videoPreview.url}` : "")}
                  alt={videoPreview?.title || "Advertisement preview"}
                  fill
                  className="object-contain object-center"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <CustomVideoPlayer
                src={(videoPreview?.url && videoPreview.url.startsWith('/'))
                  ? videoPreview.url
                  : (videoPreview?.url ? `/${videoPreview.url}` : "")}
                poster={undefined}
                className={cn("w-full aspect-video rounded-md")}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
