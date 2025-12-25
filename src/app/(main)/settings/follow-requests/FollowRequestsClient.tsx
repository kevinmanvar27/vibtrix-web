"use client";

import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import Link from "next/link";

import debug from "@/lib/debug";

interface FollowRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface FollowRequestsResponse {
  followRequests: FollowRequest[];
  nextCursor: string | null;
}

export default function FollowRequestsClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["follow-requests"],
    queryFn: async () => {
      const response = await apiClient.get<FollowRequestsResponse>("/api/users/follow-requests");
      return response.data;
    },
  });

  const { mutate: handleRequest } = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "accept" | "reject" }) => {
      const response = await apiClient.patch(`/api/users/follow-requests/${requestId}`, { action });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    },
    onError: (error) => {
      debug.error("Error handling follow request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the follow request. Please try again.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b mb-6">
          <div>
            <h1 className="text-2xl font-bold">Follow Requests</h1>
            <p className="text-sm text-muted-foreground">Manage who can follow you</p>
          </div>
        </div>
        <div className="rounded-lg border p-8 text-center bg-gray-50 dark:bg-gray-900/50">
          <div className="py-8">Loading follow requests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b mb-6">
          <div>
            <h1 className="text-2xl font-bold">Follow Requests</h1>
            <p className="text-sm text-muted-foreground">Manage who can follow you</p>
          </div>
        </div>
        <div className="rounded-lg border p-8 text-center bg-gray-50 dark:bg-gray-900/50">
          <div className="py-8 text-destructive">
            An error occurred while loading follow requests.
          </div>
        </div>
      </div>
    );
  }

  const followRequests = data?.followRequests || [];

  if (followRequests.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b mb-6">
          <div>
            <h1 className="text-2xl font-bold">Follow Requests</h1>
            <p className="text-sm text-muted-foreground">Manage who can follow you</p>
          </div>
        </div>
        <div className="rounded-lg border p-8 text-center bg-gray-50 dark:bg-gray-900/50">
          <div className="py-8 text-muted-foreground">
            You don't have any follow requests at the moment.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b mb-6">
        <div>
          <h1 className="text-2xl font-bold">Follow Requests</h1>
          <p className="text-sm text-muted-foreground">Manage who can follow you</p>
        </div>
      </div>

      <div className="space-y-4">
        {followRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={request.requester.avatarUrl}
                size={40}
                showStatus={false}
              />
              <div>
                <Link
                  href={`/users/${request.requester.username}`}
                  className="font-medium hover:underline"
                >
                  {request.requester.displayName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  @{request.requester.username}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleRequest({ requestId: request.id, action: "accept" })}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRequest({ requestId: request.id, action: "reject" })}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
