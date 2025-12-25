"use client";

import { Button } from "@/components/ui/button";
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
import { formatDistanceToNow, format } from "date-fns";
import { Edit, Eye, Megaphone, MoreHorizontal, Pause, Play, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomVideoPlayer from "@/components/ui/CustomVideoPlayer";
import { useToast } from "@/components/ui/use-toast";
import { deleteAdvertisement, updateAdvertisementStatus } from "../actions";
import { AdvertisementStatus, MediaType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

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
  createdAt: Date;
  media: {
    id: string;
    url: string;
    type: MediaType;
  };
};

interface AdvertisementTableProps {
  advertisements: Advertisement[];
}

export default function AdvertisementTable({
  advertisements,
}: AdvertisementTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [processingAdId, setProcessingAdId] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<{ url: string; title: string; type: "IMAGE" | "VIDEO" } | null>(null);

  const handleStatusChange = async (id: string, status: AdvertisementStatus) => {
    try {
      setProcessingAdId(id);
      await updateAdvertisementStatus(id, status);
      toast({
        title: "Status updated",
        description: `Advertisement status has been updated to ${status.toLowerCase()}.`,
      });
      router.refresh();
    } catch (error) {
      debug.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update advertisement status.",
        variant: "destructive",
      });
    } finally {
      setProcessingAdId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    try {
      setProcessingAdId(id);
      await deleteAdvertisement(id);
      toast({
        title: "Advertisement deleted",
        description: "The advertisement has been deleted successfully.",
      });
      router.refresh();
    } catch (error) {
      debug.error("Error deleting advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to delete advertisement.",
        variant: "destructive",
      });
    } finally {
      setProcessingAdId(null);
    }
  };

  const getStatusBadge = (status: AdvertisementStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30 dark:bg-green-500/20 dark:text-green-400">Active</Badge>;
      case "PAUSED":
        return <Badge className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400">Paused</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400">Scheduled</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 dark:bg-gray-500/20 dark:text-gray-400">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium">Advertisements</h3>
        <Button asChild>
          <Link href="/admin/advertisements/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Advertisement
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
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
                  <p>No advertisements found</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/advertisements/create">
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    {ad.media && ad.adType === "IMAGE" ? (
                      <div
                        className="relative h-12 w-16 rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setVideoPreview({ url: ad.media.url, title: ad.title, type: "IMAGE" })}
                      >
                        <Image
                          src={ad.media.url}
                          alt={ad.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : ad.media && ad.adType === "VIDEO" ? (
                      <div
                        className="relative h-12 w-16 rounded-md overflow-hidden border bg-black/5 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors"
                        onClick={() => setVideoPreview({ url: ad.media.url, title: ad.title, type: "VIDEO" })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" /></svg>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 text-center">
                          Play
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {ad.adType === "IMAGE" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
                        )}
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
                        <Link href={`/admin/advertisements/${ad.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/advertisements/edit/${ad.id}`}>
                          <Edit className="mr-2 h-4 w-4 text-blue-500" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {ad.status !== "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(ad.id, "ACTIVE")}
                        >
                          <Play className="mr-2 h-4 w-4 text-green-500" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      {ad.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(ad.id, "PAUSED")}
                        >
                          <Pause className="mr-2 h-4 w-4 text-yellow-500" />
                          Pause
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(ad.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{videoPreview?.title}</DialogTitle>
          </DialogHeader>
          <div className="w-full overflow-hidden rounded-md border">
            {videoPreview?.type === "IMAGE" ? (
              <div className="relative w-full max-h-[70vh] flex items-center justify-center p-4">
                <img
                  src={videoPreview.url}
                  alt={videoPreview.title}
                  className="max-w-full max-h-[65vh] object-contain"
                />
              </div>
            ) : videoPreview?.type === "VIDEO" && (
              <div className="aspect-video w-full">
                <CustomVideoPlayer
                  src={videoPreview.url}
                  className="w-full h-full rounded-none"
                  autoPlay
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
