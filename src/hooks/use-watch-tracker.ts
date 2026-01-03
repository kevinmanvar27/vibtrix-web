/**
 * Watch Tracker Hook
 * Tracks video watch events for the recommendation algorithm
 */

import { useCallback, useRef, useEffect } from 'react';

interface WatchEventData {
  postId: string;
  watchDuration: number;
  totalDuration: number;
  completionRate: number;
  replayed: boolean;
  replayCount: number;
  skipped: boolean;
  skipTime?: number;
  source: 'feed' | 'profile' | 'explore' | 'search' | 'share' | 'direct';
}

interface UseWatchTrackerOptions {
  postId: string;
  totalDuration: number;
  source?: WatchEventData['source'];
  onWatchComplete?: () => void;
}

// Batch queue for offline support
let watchEventQueue: WatchEventData[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

/**
 * Flush queued watch events to the server
 */
async function flushWatchEvents() {
  if (watchEventQueue.length === 0) return;

  const events = [...watchEventQueue];
  watchEventQueue = [];

  try {
    const response = await fetch('/api/posts/watch-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      // Re-queue failed events
      watchEventQueue = [...events, ...watchEventQueue];
      console.error('[WatchTracker] Failed to flush events:', await response.text());
    }
  } catch (error) {
    // Re-queue on network error
    watchEventQueue = [...events, ...watchEventQueue];
    console.error('[WatchTracker] Network error flushing events:', error);
  }
}

/**
 * Queue a watch event for batch sending
 */
function queueWatchEvent(event: WatchEventData) {
  watchEventQueue.push(event);

  // Flush after 5 seconds of inactivity or when queue reaches 10 events
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  if (watchEventQueue.length >= 10) {
    flushWatchEvents();
  } else {
    flushTimeout = setTimeout(flushWatchEvents, 5000);
  }
}

/**
 * Send a single watch event immediately
 */
async function sendWatchEvent(postId: string, event: Omit<WatchEventData, 'postId'>) {
  try {
    const response = await fetch(`/api/posts/${postId}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('[WatchTracker] Failed to send event:', await response.text());
    }
  } catch (error) {
    console.error('[WatchTracker] Network error sending event:', error);
    // Queue for retry
    queueWatchEvent({ postId, ...event });
  }
}

/**
 * Hook to track video watch events
 */
export function useWatchTracker(options: UseWatchTrackerOptions) {
  const { postId, totalDuration, source = 'feed', onWatchComplete } = options;

  const startTimeRef = useRef<number | null>(null);
  const watchDurationRef = useRef(0);
  const replayCountRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const lastReportedDurationRef = useRef(0);
  const isPlayingRef = useRef(false);

  /**
   * Called when video starts playing
   */
  const onPlay = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    isPlayingRef.current = true;
  }, []);

  /**
   * Called when video is paused
   */
  const onPause = useCallback(() => {
    if (startTimeRef.current && isPlayingRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      watchDurationRef.current += elapsed;
      startTimeRef.current = Date.now(); // Reset for next segment
    }
    isPlayingRef.current = false;
  }, []);

  /**
   * Called when video ends
   */
  const onEnded = useCallback(() => {
    if (startTimeRef.current && isPlayingRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      watchDurationRef.current += elapsed;
    }

    const completionRate = Math.min(1, watchDurationRef.current / totalDuration);
    
    if (!hasCompletedRef.current && completionRate >= 0.9) {
      hasCompletedRef.current = true;
      onWatchComplete?.();
    }

    // Send watch event
    sendWatchEvent(postId, {
      watchDuration: watchDurationRef.current,
      totalDuration,
      completionRate,
      replayed: replayCountRef.current > 0,
      replayCount: replayCountRef.current,
      skipped: false,
      source,
    });

    // Reset for potential replay
    startTimeRef.current = null;
    watchDurationRef.current = 0;
    isPlayingRef.current = false;
  }, [postId, totalDuration, source, onWatchComplete]);

  /**
   * Called when video is replayed
   */
  const onReplay = useCallback(() => {
    replayCountRef.current += 1;
    hasCompletedRef.current = false;
    startTimeRef.current = Date.now();
    watchDurationRef.current = 0;
    isPlayingRef.current = true;
  }, []);

  /**
   * Called when user skips the video
   */
  const onSkip = useCallback(() => {
    if (startTimeRef.current && isPlayingRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      watchDurationRef.current += elapsed;
    }

    const completionRate = Math.min(1, watchDurationRef.current / totalDuration);

    // Send skip event
    sendWatchEvent(postId, {
      watchDuration: watchDurationRef.current,
      totalDuration,
      completionRate,
      replayed: replayCountRef.current > 0,
      replayCount: replayCountRef.current,
      skipped: true,
      skipTime: watchDurationRef.current,
      source,
    });

    // Reset
    startTimeRef.current = null;
    watchDurationRef.current = 0;
    isPlayingRef.current = false;
  }, [postId, totalDuration, source]);

  /**
   * Called periodically to update watch progress
   */
  const onProgress = useCallback((currentTime: number) => {
    // Report progress every 5 seconds
    if (currentTime - lastReportedDurationRef.current >= 5) {
      lastReportedDurationRef.current = currentTime;
      
      // Queue progress update (batched)
      queueWatchEvent({
        postId,
        watchDuration: currentTime,
        totalDuration,
        completionRate: Math.min(1, currentTime / totalDuration),
        replayed: replayCountRef.current > 0,
        replayCount: replayCountRef.current,
        skipped: false,
        source,
      });
    }
  }, [postId, totalDuration, source]);

  /**
   * Called when video becomes visible in viewport
   */
  const onVisible = useCallback(() => {
    // Auto-play tracking starts when visible
  }, []);

  /**
   * Called when video leaves viewport
   */
  const onHidden = useCallback(() => {
    // Pause tracking when hidden
    onPause();
    
    // Send partial watch event if significant time watched
    if (watchDurationRef.current > 1) {
      const completionRate = Math.min(1, watchDurationRef.current / totalDuration);
      
      sendWatchEvent(postId, {
        watchDuration: watchDurationRef.current,
        totalDuration,
        completionRate,
        replayed: replayCountRef.current > 0,
        replayCount: replayCountRef.current,
        skipped: completionRate < 0.5, // Consider it a skip if less than 50% watched
        skipTime: completionRate < 0.5 ? watchDurationRef.current : undefined,
        source,
      });
    }
  }, [postId, totalDuration, source, onPause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Send any remaining watch data
      if (watchDurationRef.current > 1) {
        const completionRate = Math.min(1, watchDurationRef.current / totalDuration);
        
        queueWatchEvent({
          postId,
          watchDuration: watchDurationRef.current,
          totalDuration,
          completionRate,
          replayed: replayCountRef.current > 0,
          replayCount: replayCountRef.current,
          skipped: completionRate < 0.5,
          skipTime: completionRate < 0.5 ? watchDurationRef.current : undefined,
          source,
        });
      }
    };
  }, [postId, totalDuration, source]);

  return {
    onPlay,
    onPause,
    onEnded,
    onReplay,
    onSkip,
    onProgress,
    onVisible,
    onHidden,
  };
}

/**
 * Flush all pending watch events (call before page unload)
 */
export function flushPendingWatchEvents() {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  flushWatchEvents();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingWatchEvents);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingWatchEvents();
    }
  });
}
