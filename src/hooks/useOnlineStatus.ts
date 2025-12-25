'use client';

import { OnlineStatus } from '@/lib/types/onlineStatus';
import { useCallback, useEffect, useRef, useState } from 'react';

import debug from "@/lib/debug";

// Time thresholds in milliseconds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity to be considered idle

export function useOnlineStatus() {
  const [status, setStatus] = useState<OnlineStatus>(OnlineStatus.ONLINE);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialStatusSentRef = useRef(false);

  // Function to update the status on the server
  const updateStatus = useCallback(async (newStatus: OnlineStatus) => {
    try {
      // Make sure we have a valid status value
      if (!newStatus || !Object.values(OnlineStatus).includes(newStatus)) {
        debug.error('Invalid status value for online status update:', newStatus);
        return;
      }

      // Create the request body with proper JSON
      const requestBody = JSON.stringify({ status: newStatus });

      // Log the request for debugging
      debug.log('Sending online status update:', requestBody);

      const response = await fetch('/api/users/online-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        debug.error('Online status update failed:', response.status, errorData);
      }
    } catch (error) {
      debug.error('Failed to update online status:', error);
    }
  }, []);

  // Reset activity timer
  const resetActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);

    // Only update status if it's different to avoid unnecessary renders
    if (status !== OnlineStatus.ONLINE) {
      setStatus(OnlineStatus.ONLINE);
      updateStatus(OnlineStatus.ONLINE);
    }
  }, [status, updateStatus]);

  // Set up event listeners for user activity
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const handleActivity = () => {
      resetActivity();
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Set initial status only once
    if (!initialStatusSentRef.current) {
      updateStatus(OnlineStatus.ONLINE);
      initialStatusSentRef.current = true;
    }

    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetActivity();
      } else {
        setStatus(OnlineStatus.IDLE);
        updateStatus(OnlineStatus.IDLE);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up beforeunload listener to set offline status
    // Use a synchronous approach for beforeunload since async might not complete
    const handleBeforeUnload = () => {
      try {
        // Use navigator.sendBeacon which is designed for this purpose
        if (navigator.sendBeacon) {
          const blob = new Blob(
            [JSON.stringify({ status: OnlineStatus.OFFLINE })],
            { type: 'application/json' }
          );
          navigator.sendBeacon('/api/users/online-status', blob);
        } else {
          // Fallback to synchronous XHR if sendBeacon is not available
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/users/online-status', false); // false makes it synchronous
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({ status: OnlineStatus.OFFLINE }));
        }
      } catch (error) {
        // Can't log here as the page is unloading
        // But at least we tried to update the status
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up event listeners
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [resetActivity, updateStatus]);

  // Set up timer to check for idle status - optimized to reduce polling frequency
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Clear existing timer
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
    }

    // Use a more efficient approach with setTimeout instead of setInterval
    // This will schedule the next check only after the current one completes
    const scheduleNextCheck = () => {
      idleTimerRef.current = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivity;

        // Only update if we need to change status to avoid unnecessary renders
        if (timeSinceLastActivity >= IDLE_THRESHOLD && status === OnlineStatus.ONLINE) {
          setStatus(OnlineStatus.IDLE);
          updateStatus(OnlineStatus.IDLE);
        }

        // Schedule the next check with a longer interval if user is already idle
        // This reduces unnecessary checks when the user is away
        const nextInterval = status === OnlineStatus.IDLE ? 120000 : 60000; // 2 minutes if idle, 1 minute if active
        scheduleNextCheck();
      }, status === OnlineStatus.IDLE ? 120000 : 60000); // 2 minutes if idle, 1 minute if active
    };

    // Start the first check
    scheduleNextCheck();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [lastActivity, status, updateStatus]);

  return status;
}
