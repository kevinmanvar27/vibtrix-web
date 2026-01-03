"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Edit, Eye, MoreHorizontal, Trash, Trophy, Users, IndianRupee, Clock, Timer, CheckCircle2, Ban, CheckCircle, Settings, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CompetitionMediaType } from "@prisma/client";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { deleteCompetition, toggleCompetitionStatus, toggleCompetitionFeedStickers } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import { HtmlContent } from "@/components/ui/html-content";

import debug from "@/lib/debug";

type CompetitionRound = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  likesToPass: number | null;
};

type Competition = {
  id: string;
  title: string;
  description: string;
  isPaid: boolean;
  entryFee: number | null;
  mediaType: CompetitionMediaType;
  isActive: boolean;
  hasPrizes: boolean;
  showStickeredMedia: boolean;
  rounds: CompetitionRound[];
  _count: {
    participants: number;
    rounds: number;
  };
};

/**
 * Pagination info for the table
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface CompetitionTableProps {
  competitions: Competition[];
  pagination?: PaginationInfo;
}

export default function CompetitionTable({ competitions, pagination }: CompetitionTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/competitions?${params.toString()}`);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      await toggleCompetitionStatus(id, !currentStatus);
      toast({
        title: currentStatus ? "Competition disabled" : "Competition enabled",
        description: `The competition has been ${currentStatus ? "disabled" : "enabled"} successfully. ${currentStatus ? "It will no longer be visible to users." : "It is now visible to users."}`
      });
      // Refresh the page to show updated status
      router.refresh();
    } catch (error: any) {
      debug.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to update competition status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Media display toggle function is kept for use in dropdown menu if needed later

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this competition? This action cannot be undone and will delete all related data including participants, rounds, and entries.")) {
      return;
    }

    setProcessingId(id);
    try {
      await deleteCompetition(id);
      toast({
        title: "Competition deleted",
        description: "The competition has been deleted successfully.",
      });
      // Refresh the page to show updated list
      router.refresh();
    } catch (error: any) {
      debug.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to determine competition lifecycle status
  const getCompetitionStatus = (competition: Competition) => {
    if (competition.rounds.length === 0) return "Not Started";

    const currentDate = new Date();

    // Check if any round has started
    const anyRoundStarted = competition.rounds.some(round =>
      new Date(round.startDate) <= currentDate
    );

    // Check if all rounds have ended
    const allRoundsEnded = competition.rounds.every(round =>
      new Date(round.endDate) < currentDate
    );

    if (anyRoundStarted) {
      if (allRoundsEnded) {
        return "Completed";
      } else {
        return "Active";
      }
    }

    return "Upcoming";
  };

  // Helper function to determine if a competition is completed
  const isCompetitionCompleted = (competition: Competition) => {
    return getCompetitionStatus(competition) === "Completed";
  };

  // Calculate the starting serial number based on pagination
  const getSerialNumber = (index: number) => {
    if (pagination) {
      return (pagination.currentPage - 1) * Math.ceil(pagination.totalCount / pagination.totalPages) + index + 1;
    }
    return index + 1;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">Sr. No.</TableHead>
              <TableHead className="w-[300px]"><div className="flex items-center"><Trophy className="h-4 w-4 mr-2 text-primary" /> Title</div></TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[180px]">Dates</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No competitions found
                </TableCell>
              </TableRow>
            ) : (
              competitions.map((competition, index) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium text-center p-4 align-middle">
                    {getSerialNumber(index)}
                  </TableCell>
                  <TableCell className="font-medium p-4 align-middle">
                    <div className="py-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={competition.id ? `/admin/competitions/${competition.id}/edit` : '#'}
                          className="hover:underline cursor-pointer font-semibold"
                        >
                          {competition.title}
                        </Link>
                        {competition.isPaid && (
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            {competition.entryFee} INR
                          </Badge>
                        )}
                        <Link href={competition.id ? `/admin/competitions/${competition.id}/participants` : '#'}>
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-200">
                            <Users className="h-3 w-3 mr-1" />
                            {competition._count.participants}
                          </Badge>
                        </Link>
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[270px]">
                        {competition.description && (
                          <HtmlContent html={competition.description} />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 align-middle">
                    {/* Lifecycle Status Badge */}
                    {(() => {
                      const status = getCompetitionStatus(competition);
                      let statusIcon;
                      let badgeVariant: "secondary" | "destructive" | "default" | "outline" | null | undefined = "secondary";
                      let badgeClass = "";

                      switch (status) {
                        case "Active":
                          statusIcon = <Timer className="h-3 w-3 mr-1" />;
                          badgeVariant = "default";
                          badgeClass = "bg-green-500 hover:bg-green-600";
                          break;
                        case "Upcoming":
                          statusIcon = <Clock className="h-3 w-3 mr-1" />;
                          badgeVariant = "secondary";
                          badgeClass = "bg-blue-500 hover:bg-blue-600 text-white";
                          break;
                        case "Completed":
                          statusIcon = <CheckCircle2 className="h-3 w-3 mr-1" />;
                          badgeVariant = "outline";
                          badgeClass = "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
                          break;
                        default:
                          statusIcon = null;
                          badgeVariant = "secondary";
                      }

                      return (
                        <div className="space-y-2 py-1">
                          <Badge variant={badgeVariant} className={`${badgeClass} px-2 py-1`}>
                            {statusIcon}
                            {status}
                          </Badge>

                          {/* Active/Inactive Status */}
                          <Badge variant={competition.isActive ? "outline" : "destructive"} className="text-xs px-2 py-1">
                            {competition.isActive ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="p-4 align-middle">
                    <div className="space-y-1 text-sm py-1">
                      {competition.rounds.length > 0 ? (
                        <>
                          <div className="py-0.5">
                            <span className="font-medium">Start:</span> {format(competition.rounds[0].startDate, "MMM d, yyyy")}
                          </div>
                          <div className="py-0.5">
                            <span className="font-medium">End:</span> {format(competition.rounds[competition.rounds.length - 1].endDate, "MMM d, yyyy")}
                          </div>
                          <div className="py-0.5">
                            <span className="font-medium">Rounds:</span> {competition.rounds.length}
                          </div>
                        </>
                      ) : (
                        <div>No rounds defined</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0" disabled={processingId === competition.id}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={competition.id ? `/admin/competitions/${competition.id}` : '#'}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={competition.id ? `/admin/competitions/${competition.id}/edit` : '#'}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Competition
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handleToggleStatus(competition.id, competition.isActive)}>
                          {competition.isActive ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Disable Competition
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable Competition
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={competition.id ? `/admin/competitions/${competition.id}/participants` : '#'}>
                            <Users className="mr-2 h-4 w-4" />
                            Participants
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={competition.id ? `/admin/competitions/${competition.id}/feed-settings` : '#'}>
                            <Settings className="mr-2 h-4 w-4" />
                            Feed Settings
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={competition.id ? `/admin/competitions/${competition.id}/advertisements` : '#'}>
                            <Megaphone className="mr-2 h-4 w-4" />
                            Advertisements
                          </Link>
                        </DropdownMenuItem>

                        {competition.hasPrizes && isCompetitionCompleted(competition) && (
                          <DropdownMenuItem asChild>
                            <Link href={competition.id ? `/admin/competitions/${competition.id}#prize-payments` : '#'}>
                              <IndianRupee className="mr-2 h-4 w-4" />
                              Prize Payments
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(competition.id)}
                          disabled={processingId === competition.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {processingId === competition.id ? "Processing..." : "Delete Competition"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
