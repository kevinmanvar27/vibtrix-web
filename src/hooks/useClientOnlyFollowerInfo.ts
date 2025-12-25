'use client';

import { useEffect, useState } from 'react';

export function useClientOnlyFollowerInfo(userId: string, initialState: { followers: number; isFollowedByUser: boolean }) {
  const [isClient, setIsClient] = useState(false);
  const [followerInfo, setFollowerInfo] = useState(initialState);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    let intervalId: NodeJS.Timeout;

    const fetchFollowerInfo = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/follower-info`);
        if (response.ok) {
          const data = await response.json();
          setFollowerInfo({
            followers: data.followers || initialState.followers,
            isFollowedByUser: data.isFollowedByUser || initialState.isFollowedByUser
          });
        }
      } catch (error) {
        // Silently handle error - no logging needed in production
      }
    };

    // Initial fetch
    fetchFollowerInfo();

    // Set up interval for updates (every 30 seconds)
    intervalId = setInterval(fetchFollowerInfo, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [userId, isClient, initialState.followers, initialState.isFollowedByUser]);

  return {
    data: followerInfo,
    isLoading: isClient && followerInfo === initialState,
    error: null
  };
}
