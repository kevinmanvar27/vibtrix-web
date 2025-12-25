'use client';

import { OnlineStatus } from '@/lib/types/onlineStatus';
import { useEffect, useState } from 'react';

export function useClientOnlyUserOnlineStatus(userId: string) {
  const [isClient, setIsClient] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    let intervalId: NodeJS.Timeout;

    const fetchOnlineStatus = async () => {
      try {
        const response = await fetch(`/api/users/online-status?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setOnlineStatus(data.onlineStatus as OnlineStatus);
        }
      } catch (error) {
        // Silently handle error - no logging needed in production
      }
    };

    // Initial fetch
    fetchOnlineStatus();

    // Set up interval for updates
    intervalId = setInterval(fetchOnlineStatus, 60000); // Update every minute

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userId, isClient]);

  return {
    data: onlineStatus ? { status: onlineStatus, lastActiveAt: null } : null,
    isLoading: isClient && onlineStatus === null,
    error: null
  };
}
