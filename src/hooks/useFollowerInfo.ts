import apiClient from "@/lib/api-client";
import { FollowerInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function useFollowerInfo(
  userId: string,
  initialState: FollowerInfo,
) {
  const query = useQuery({
    queryKey: ["follower-info", userId],
    queryFn: async (): Promise<FollowerInfo> => {
      try {
        const response = await apiClient.get<FollowerInfo>(`/api/users/${userId}/followers`);
        return response.data;
      } catch (error: any) {
        // Handle unauthorized errors gracefully
        if (error.status === 401) {
          return {
            isFollowedByUser: false,
            followers: initialState.followers
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
