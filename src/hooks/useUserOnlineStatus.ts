'use client';

import { OnlineStatus } from '@/lib/types/onlineStatus';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function useUserOnlineStatus(userId: string) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return useQuery({
    queryKey: ['user-online-status', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/online-status?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user online status');
      }

      const data = await response.json();
      return {
        status: data.onlineStatus as OnlineStatus,
        lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : null,
      };
    },
    refetchInterval: (data) => {
      // Adaptive refetch interval based on user's status
      if (data?.status === OnlineStatus.ONLINE) {
        return 60000; // 1 minute for online users
      } else if (data?.status === OnlineStatus.IDLE) {
        return 120000; // 2 minutes for idle users
      } else {
        return 300000; // 5 minutes for offline users
      }
    },
    staleTime: 60000, // Consider data stale after 1 minute (increased from 30s)
    refetchOnWindowFocus: true,
    // Reduce network requests when tab is not visible
    refetchIntervalInBackground: false,
    enabled: isClient && typeof window !== 'undefined', // Only run on client side
  });
}
