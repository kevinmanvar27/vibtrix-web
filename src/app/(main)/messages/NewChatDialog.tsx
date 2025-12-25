"use client";

import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import useDebounce from "@/hooks/useDebounce";
import apiClient from "@/lib/api-client";
import { UserData } from "@/lib/types";
import { OnlineStatus } from "@/lib/types/onlineStatus";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { useSession } from "../SessionProvider";

import debug from "@/lib/debug";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const { toast } = useToast();
  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebounce(searchInput);

  const [selectedUsers, setSelectedUsers] = useState<UserData[]>([]);

  // Search users
  const { data, isFetching, isError } = useQuery({
    queryKey: ["search-users", searchInputDebounced],
    queryFn: async () => {
      if (!searchInputDebounced || searchInputDebounced.length < 2) {
        return { users: [] };
      }
      const response = await apiClient.get<{ users: UserData[] }>("/api/users/search", {
        params: { q: searchInputDebounced }
      });
      return response.data;
    },
    enabled: searchInputDebounced.length >= 2,
  });

  // Create chat mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (selectedUsers.length === 0) {
        throw new Error("Please select at least one user to chat with");
      }

      const isGroupChat = selectedUsers.length > 1;
      const name = isGroupChat
        ? `${loggedInUser?.displayName || 'Unknown'}, ${selectedUsers.map((u) => u.displayName).join(", ")}`
        : undefined;

      try {
        debug.log('Creating chat with participants:', selectedUsers.map(u => u.id));
        debug.log('Current user:', loggedInUser);
        debug.log('Is group chat:', isGroupChat);

        const response = await apiClient.post('/api/chats', {
          participantIds: selectedUsers.map((u) => u.id),
          name,
          isGroupChat,
        });

        debug.log('Chat created successfully:', response.data);
        return response.data;
      } catch (error) {
        debug.error("Error creating chat:", error);
        // Log more details about the error
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          debug.error("Error response data:", axiosError.response?.data);
          debug.error("Error response status:", axiosError.response?.status);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      debug.log('Chat creation successful, data:', data);
      onChatCreated();
    },
    onError(error) {
      debug.error("Error starting chat", error);
      toast({
        variant: "destructive",
        title: "Chat Creation Failed",
        description: error instanceof Error ? error.message : "Error starting chat. Please try again.",
      });
    },
  });

  const users = data?.users || [];
  const filteredUsers = users.filter(user => user.id !== loggedInUser?.id);

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New chat</DialogTitle>
        </DialogHeader>
        <div>
          <div className="group relative">
            <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="Search users..."
              className="h-12 w-full pe-4 ps-14 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {!!selectedUsers.length && (
            <div className="mt-4 flex flex-wrap gap-2 p-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}
          <hr />
          <div className="h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserResult
                  key={user.id}
                  user={user}
                  selected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={() => {
                    setSelectedUsers((prev) =>
                      prev.some((u) => u.id === user.id)
                        ? prev.filter((u) => u.id !== user.id)
                        : [...prev, user],
                    );
                  }}
                />
              ))
            ) : searchInputDebounced.length >= 2 && !isFetching ? (
              <p className="my-3 text-center text-muted-foreground">
                No users found. Try a different name.
              </p>
            ) : searchInputDebounced.length < 2 ? (
              <p className="my-3 text-center text-muted-foreground">
                Type at least 2 characters to search
              </p>
            ) : null}

            {isFetching && <Loader2 className="mx-auto my-3 animate-spin" />}
            {isError && (
              <p className="my-3 text-center text-destructive">
                An error occurred while loading users.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            disabled={!selectedUsers.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Start chat
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserResultProps {
  user: UserData;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ user, selected, onClick }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          showStatus={user.showOnlineStatus}
          status={user.onlineStatus as OnlineStatus}
          statusSize="sm"
        />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.displayName}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {selected && <Check className="size-5 text-orange-500" />}
    </button>
  );
}

interface SelectedUserTagProps {
  user: UserData;
  onRemove: () => void;
}

function SelectedUserTag({ user, onRemove }: SelectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-2 rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar
        avatarUrl={user.avatarUrl}
        size={24}
        showStatus={user.showOnlineStatus}
        status={user.onlineStatus as OnlineStatus}
        statusSize="sm"
      />
      <p className="font-bold">{user.displayName}</p>
      <X className="mx-2 size-5 text-muted-foreground" />
    </button>
  );
}
