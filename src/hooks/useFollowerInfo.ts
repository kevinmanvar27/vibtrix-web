import apiClient from "@/lib/api-client";
import { FollowerInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function useFollowerInfo(
  userId: string,
  initialState: FollowerInfo,
) {
  const query = useQuery({
    queryKey: ["follower-info", userId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<FollowerInfo>(`/api/users/${userId}/followers`);
        return response.data;
      } catch (error: any) {
        // Handle unauthorized errors gracefully
        if (error.status === 401) {
          return {
            isFollowedByUser: false,
            followerCount: initialState.followerCount,
            followingCount: initialState.followingCount
          };
        }
        throw error;
      }
    },
    initialData: initialState,
    staleTime: Infinity,
  });

  return query;
}
