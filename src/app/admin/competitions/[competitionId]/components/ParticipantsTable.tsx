"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Participant = {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  roundEntries: Array<{
    id: string;
    participantId: string;
    roundId: string;
    postId: string | null;
    post?: {
      id: string;
      likesCount?: number;
    } | null;
  }>;
  isDisqualified: boolean;
  disqualifyReason: string | null;
  createdAt: Date;
  totalLikes?: number;
};

interface ParticipantsTableProps {
  participants: Participant[];
  competitionId: string;
}

export default function ParticipantsTable({ participants, competitionId }: ParticipantsTableProps) {
  // Calculate total likes for each participant
  const participantsWithLikes = participants.map(participant => {
    const totalLikes = participant.roundEntries.reduce((sum, entry) => {
      return sum + (entry.post?.likesCount || 0);
    }, 0);
    return { ...participant, totalLikes };
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right"><ThumbsUp className="h-4 w-4 inline mr-1" /> Total Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participantsWithLikes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No participants yet
                </TableCell>
              </TableRow>
            ) : (
              participantsWithLikes.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.user.avatarUrl || undefined} alt={participant.user.displayName} />
                        <AvatarFallback>
                          {participant.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{participant.user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{participant.user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(participant as any).currentRoundId ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Eliminated</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {participant.roundEntries.length} submissions
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(participant.createdAt, { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{participant.totalLikes}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
