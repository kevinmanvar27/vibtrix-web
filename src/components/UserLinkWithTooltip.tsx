"use client";

import apiClient from "@/lib/api-client";
import { UserData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PropsWithChildren } from "react";
import UserTooltip from "./UserTooltip";

interface UserLinkWithTooltipProps extends PropsWithChildren {
  username: string;
}

export default function UserLinkWithTooltip({
  children,
  username,
}: UserLinkWithTooltipProps) {
  const { data } = useQuery({
    queryKey: ["user-data", username],
    queryFn: async () => {
      try {
        const response = await apiClient.get<UserData>(`/api/users/username/${username}`);
        return response.data;
      } catch (error: any) {
        if (error.status === 404) {
          throw new Error('User not found');
        }
        throw error;
      }
    },
    retry(failureCount, error) {
      if (error instanceof Error && error.message === 'User not found') {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: Infinity,
  });

  if (!data) {
    return (
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    );
  }

  return (
    <UserTooltip user={data}>
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    </UserTooltip>
  );
}
