"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { ExternalLink, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type RoundEntry = {
  id: string;
  participantId: string;
  roundId: string;
  postId: string | null;
  qualifiedForNextRound: boolean | null;
  round: {
    id: string;
    name: string;
  };
  post: {
    id: string;
    content: string;
    likesCount?: number;
  } | null;
  participant: {
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
};

interface RoundParticipantsTableProps {
  roundEntries: RoundEntry[];
  roundName: string;
}

export default function RoundParticipantsTable({ roundEntries, roundName }: RoundParticipantsTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Post</TableHead>
              <TableHead className="text-right"><ThumbsUp className="h-4 w-4 inline mr-1" /> Likes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roundEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No participants in this round
                </TableCell>
              </TableRow>
            ) : (
              roundEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.participant.user.avatarUrl || undefined} alt={entry.participant.user.displayName} />
                        <AvatarFallback>
                          {entry.participant.user.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{entry.participant.user.displayName}</div>
                        <div className="text-sm text-muted-foreground">@{entry.participant.user.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.qualifiedForNextRound === true ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Qualified</Badge>
                    ) : entry.qualifiedForNextRound === false ? (
                      <Badge variant="secondary">Eliminated</Badge>
                    ) : entry.postId ? (
                      <Badge variant="outline">Submitted</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.postId ? (
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Post submitted</span>
                        {entry.post && (
                          <Button variant="outline" size="sm" asChild className="h-7 px-2">
                            <Link href={`/posts/${entry.postId}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              View
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No post submitted</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{entry.post?.likesCount || 0}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
