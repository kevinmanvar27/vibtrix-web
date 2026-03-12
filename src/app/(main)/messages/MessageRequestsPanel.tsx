"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Check, Loader2, MessageSquare, X } from "lucide-react";
import Link from "next/link";

interface MessageRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface MessageRequestsPanelProps {
  open: boolean;
  onBack: () => void;
  onChatAccepted: (chatId: string) => void;
}

export default function MessageRequestsPanel({
  open,
  onBack,
  onChatAccepted,
}: MessageRequestsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const response = await fetch("/api/message-requests");
      if (!response.ok) throw new Error("Failed to fetch message requests");
      return response.json() as Promise<{ requests: MessageRequest[] }>;
    },
  });

  const requests = data?.requests || [];

  const handleMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "reject";
    }) => {
      const response = await fetch(`/api/message-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to handle request");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate requests list
      queryClient.invalidateQueries({ queryKey: ["message-requests"] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      if (variables.action === "accept") {
        toast({ title: "Message request accepted" });
        if (data?.chat?.id) {
          onChatAccepted(data.chat.id);
        }
      } else {
        toast({ title: "Message request declined" });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    },
  });

  return (
    <div
      className={cn(
        // On mobile: show only when open=true. On desktop: always show.
        "flex h-full w-full flex-col border-r bg-card md:w-80",
        !open && "hidden md:flex"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button size="icon" variant="ghost" onClick={onBack}>
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">Message Requests</h2>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare className="size-12 text-muted-foreground/40" />
            <p className="font-medium">No message requests</p>
            <p className="text-sm text-muted-foreground">
              When someone with a private profile sends you a message, it will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {requests.map((request) => (
              <MessageRequestItem
                key={request.id}
                request={request}
                isPending={
                  handleMutation.isPending &&
                  handleMutation.variables?.requestId === request.id
                }
                onAccept={() =>
                  handleMutation.mutate({ requestId: request.id, action: "accept" })
                }
                onReject={() =>
                  handleMutation.mutate({ requestId: request.id, action: "reject" })
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface MessageRequestItemProps {
  request: MessageRequest;
  isPending: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function MessageRequestItem({
  request,
  isPending,
  onAccept,
  onReject,
}: MessageRequestItemProps) {
  return (
    <li className="flex flex-col gap-3 p-4">
      {/* User info */}
      <div className="flex items-center gap-3">
        <UserAvatar avatarUrl={request.sender.avatarUrl} showStatus={false} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/users/${request.sender.username}`}
            className="block truncate font-semibold hover:underline"
          >
            {request.sender.displayName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{request.sender.username}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {format(new Date(request.createdAt), "MMM d")}
        </span>
      </div>

      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {request.sender.displayName}
        </span>{" "}
        wants to send you a message.
      </p>

      {/* Accept / Decline buttons — Instagram-style */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
          onClick={onAccept}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Accept
        </Button>
        <Button
          className="flex-1 gap-1.5"
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
          Decline
        </Button>
      </div>
    </li>
  );
}
