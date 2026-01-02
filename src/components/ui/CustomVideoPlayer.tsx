'use client';

import { useEffect, useRef, useState, forwardRef, ForwardedRef, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Maximize, Minimize } from 'lucide-react';
import './video-player.css';
import { startMeasure } from '@/lib/performance-monitor';

import debug from "@/lib/debug";

interface CustomVideoPlayerProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
  onDoubleClick?: () => void;
  poster?: string;
  urlHigh?: string;
  urlMedium?: string;
  urlLow?: string;
  urlThumbnail?: string;
  adaptiveQuality?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const CustomVideoPlayer = forwardRef(function CustomVideoPlayer({
  src,
  className = '',
  style,
  onError,
  onDoubleClick,
  poster,
  urlHigh,
  urlMedium,
  urlLow,
  urlThumbnail,
  adaptiveQuality = true,
  autoPlay = false,
  muted = false,
  loop = true
}: CustomVideoPlayerProps, ref: ForwardedRef<HTMLVideoElement>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle forwarded ref
  useEffect(() => {
    if (ref && videoRef.current) {
      if (typeof ref === 'function') {
        ref(videoRef.current);
      } else {
        ref.current = videoRef.current;
      }
    }
  }, [ref]);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>(src);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');
  const [selectedQuality, setSelectedQuality] = useState<string>('original');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);

  // Select appropriate quality based on connection and device
  const selectAppropriateQuality = useCallback(() => {
    if (!adaptiveQuality) {
      setSelectedQuality('original');
      return;
    }

    // Get connection info if available
    let effectiveConnectionType = 'unknown';
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      effectiveConnectionType = (navigator as any).connection?.effectiveType || 'unknown';
    }

    // Get screen width
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;

    // Determine quality based on connection and screen size
    if (effectiveConnectionType === 'slow-2g' || effectiveConnectionType === '2g') {
      // Very slow connection - use lowest quality
      setSelectedQuality(urlThumbnail ? 'thumbnail' : (urlLow ? 'low' : 'original'));
    } else if (effectiveConnectionType === '3g') {
      // Medium connection - use medium quality
      setSelectedQuality(urlLow ? 'low' : 'original');
    } else if (screenWidth <= 768) {
      // Mobile device - use medium quality
      setSelectedQuality(urlMedium ? 'medium' : 'original');
    } else {
      // Good connection and larger screen - use high quality
      setSelectedQuality(urlHigh ? 'high' : 'original');
    }
  }, [adaptiveQuality, urlHigh, urlMedium, urlLow, urlThumbnail]);

  // Detect network connection quality
  useEffect(() => {
    // Only run in browser environment and when navigator is available
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    // Check if the Network Information API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      // Set initial values
      setConnectionType(connection?.type || 'unknown');
      setEffectiveType(connection?.effectiveType || 'unknown');

      // Listen for changes
      const updateConnectionInfo = () => {
        setConnectionType(connection?.type || 'unknown');
        setEffectiveType(connection?.effectiveType || 'unknown');
        selectAppropriateQuality();
      };

      if (connection && typeof connection.addEventListener === 'function') {
        connection.addEventListener('change', updateConnectionInfo);
      } else if (connection) {
        // Fallback for browsers that only support onchange
        connection.onchange = updateConnectionInfo;
      }

      return () => {
        if (connection && typeof connection.removeEventListener === 'function') {
          connection.removeEventListener('change', updateConnectionInfo);
        } else if (connection) {
          connection.onchange = null;
        }
      };
    }
  }, [selectAppropriateQuality]);

  // Determine available qualities
  useEffect(() => {
    const qualities = ['original'];
    if (urlHigh) qualities.push('high');
    if (urlMedium) qualities.push('medium');
    if (urlLow) qualities.push('low');
    if (urlThumbnail) qualities.push('thumbnail');
    setAvailableQualities(qualities);

    // Select appropriate quality
    selectAppropriateQuality();
  }, [urlHigh, urlMedium, urlLow, urlThumbnail, selectAppropriateQuality]);

  // Update video source when quality changes
  useEffect(() => {
    let newSrc = src;

    if (selectedQuality === 'high' && urlHigh) {
      newSrc = urlHigh;
    } else if (selectedQuality === 'medium' && urlMedium) {
      newSrc = urlMedium;
    } else if (selectedQuality === 'low' && urlLow) {
      newSrc = urlLow;
    } else if (selectedQuality === 'thumbnail' && urlThumbnail) {
      newSrc = urlThumbnail;
    }

    // Add debugging to log the original source
    debug.log('CustomVideoPlayer: Original video source:', newSrc);

    // Make sure the URL is absolute for local uploads
    if (typeof newSrc === 'string' && newSrc.startsWith('/uploads/')) {
      // Add the base URL for local development
      if (typeof window !== 'undefined') {
        const baseUrl = window.location.origin;
        const absoluteUrl = `${baseUrl}${newSrc}`;
        debug.log('CustomVideoPlayer: Converting relative URL to absolute:', {
          relative: newSrc,
          absolute: absoluteUrl
        });
        newSrc = absoluteUrl;
      }
    } else {
      debug.log('CustomVideoPlayer: URL does not start with /uploads/, keeping as is');
    }

    // Add debugging to log the final source
    debug.log('CustomVideoPlayer: Final video source:', newSrc);

    setVideoSrc(newSrc);
  }, [selectedQuality, src, urlHigh, urlMedium, urlLow, urlThumbnail]);

  // Safety check to ensure we always have a valid video source
  useEffect(() => {
    if (!videoSrc && src) {
      setVideoSrc(src);
    }
  }, [videoSrc, src]);

  // Add a fallback mechanism for video loading errors
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [showFallbackUI, setShowFallbackUI] = useState(false);
  const maxLoadAttempts = 3;

  // Default fallback assets
  const fallbackVideoUrl = '/assets/fallback/video-unavailable.mp4';
  const fallbackPosterUrl = '/assets/fallback/video-unavailable.svg';

  // State to track if we're using the fallback video
  const [usingFallbackVideo, setUsingFallbackVideo] = useState(false);

  // Check if the video file exists
  useEffect(() => {
    if (!videoSrc) return;

    // Only check for files that are on our server
    if (videoSrc.includes('/uploads/')) {
      // Check if this is an original URL that might have a stickered version
      const isOriginalUrl = videoSrc.includes('/uploads/original/');

      // Create a HEAD request to check if the file exists
      fetch(videoSrc, { method: 'HEAD' })
        .then(response => {
          if (!response.ok && response.status === 404) {
            debug.error('CustomVideoPlayer: Video file not found (404):', videoSrc);

            // If this is an original URL, try the stickered version
            if (isOriginalUrl) {
              const stickeredUrl = videoSrc.replace('/uploads/original/', '/uploads/stickered/');
              debug.log('CustomVideoPlayer: Trying stickered version:', stickeredUrl);

              // Check if the stickered version exists
              fetch(stickeredUrl, { method: 'HEAD' })
                .then(stickeredResponse => {
                  if (stickeredResponse.ok) {
                    // Use the stickered version instead
                    debug.log('CustomVideoPlayer: Using stickered version:', stickeredUrl);
                    setVideoSrc(stickeredUrl);
                    return;
                  } else {
                    // Stickered version doesn't exist either, try fallback
                    tryFallbackVideo();
                  }
                })
                .catch(() => {
                  // Error checking stickered version, try fallback
                  tryFallbackVideo();
                });
            } else {
              // Not an original URL, try fallback directly
              tryFallbackVideo();
            }
          }
        })
        .catch(error => {
          debug.error('CustomVideoPlayer: Error checking video file:', error);
        });
    }

    // Helper function to try the fallback video
    function tryFallbackVideo() {
      // Check if the fallback video exists
      fetch(fallbackVideoUrl, { method: 'HEAD' })
        .then(fallbackResponse => {
          if (fallbackResponse.ok) {
            // Use the fallback video instead
            debug.log('CustomVideoPlayer: Using fallback video:', fallbackVideoUrl);
            setUsingFallbackVideo(true);
          } else {
            // Fallback video doesn't exist either, show fallback UI
            debug.error('CustomVideoPlayer: Fallback video not found, showing fallback UI');
            setShowFallbackUI(true);
            if (onError) onError();
          }
        })
        .catch(() => {
          // Error checking fallback video, show fallback UI
          setShowFallbackUI(true);
          if (onError) onError();
        });
    }
  }, [videoSrc, onError, fallbackVideoUrl]);

  // Handle video loading errors with retry logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      const currentAttempt = loadAttempts + 1;
      debug.error(`CustomVideoPlayer: Video load error (attempt ${currentAttempt}/${maxLoadAttempts}):`, {
        src: videoSrc,
        error: video.error?.message || 'Unknown error',
        code: video.error?.code
      });

      // If we already know the file is missing (404), don't retry
      if (videoSrc && videoSrc.includes('/uploads/')) {
        // Quick check for 404 errors
        fetch(videoSrc, { method: 'HEAD' })
          .then(response => {
            if (!response.ok && response.status === 404) {
              debug.error('CustomVideoPlayer: Video file confirmed not found (404):', videoSrc);
              // File doesn't exist, show fallback UI immediately
              setShowFallbackUI(true);
              if (onError) onError();
              return;
            }

            // File exists but there's another error, try to recover
            continueWithRetry();
          })
          .catch(() => {
            // Network error or CORS issue, try to recover
            continueWithRetry();
          });
      } else {
        // Not a local file, proceed with retry
        continueWithRetry();
      }

      function continueWithRetry() {
        if (currentAttempt < maxLoadAttempts) {
          // Try with a different approach on each attempt
          const nextAttempt = currentAttempt;
          setLoadAttempts(nextAttempt);

          // Add a small delay before retrying
          setTimeout(() => {
            debug.log(`CustomVideoPlayer: Attempting retry ${nextAttempt} of ${maxLoadAttempts}`);

            if (nextAttempt === 1) {
              // First retry: Try with a fully qualified URL
              if (typeof videoSrc === 'string' && !videoSrc.startsWith('http')) {
                const baseUrl = window.location.origin;
                const absoluteUrl = videoSrc.startsWith('/')
                  ? `${baseUrl}${videoSrc}`
                  : `${baseUrl}/${videoSrc}`;
                debug.log('CustomVideoPlayer: Retry with absolute URL:', absoluteUrl);
                setVideoSrc(absoluteUrl);
              } else if (video) {
                // If already absolute, just reload
                video.load();
              }
            } else {
              // Last retries: Try with a cache-busting parameter
              const cacheBuster = `?cb=${Date.now()}`;
              const urlWithCacheBuster = videoSrc.includes('?')
                ? `${videoSrc}&cb=${Date.now()}`
                : `${videoSrc}${cacheBuster}`;
              debug.log('CustomVideoPlayer: Retry with cache buster:', urlWithCacheBuster);
              setVideoSrc(urlWithCacheBuster);
            }
          }, 1000);
        } else {
          // All retry attempts failed, show fallback UI
          debug.error('CustomVideoPlayer: All retry attempts failed, showing fallback UI');
          setShowFallbackUI(true);

          // Call the error handler
          if (onError) {
            onError();
          }
        }
      }
    };

    // Add error event listener
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('error', handleError);
    };
  }, [videoSrc, loadAttempts, maxLoadAttempts, onError]);

  // Reset state when video source changes
  useEffect(() => {
    setLoadAttempts(0);
    setShowFallbackUI(false);
  }, [videoSrc]);

  // Handle video metadata loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Handle video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Handle play/pause state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle controls visibility
  useEffect(() => {
    if (isHovering || !isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
      return;
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [isHovering, isPlaying]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format time (seconds) to MM:SS - memoize to prevent re-renders
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  // Toggle play/pause - memoize to prevent re-renders
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  // Toggle mute - memoize to prevent re-renders
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Toggle fullscreen - memoize to prevent re-renders
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        // Silent error in production
        if (process.env.NODE_ENV === 'development') {
          debug.error(`Error attempting to enable fullscreen: ${err.message}`);
        }
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Handle progress bar click - memoize to prevent re-renders
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video || !video.duration) return;

    const rect = progressBar.getBoundingClientRect();
    if (!rect.width) return; // Safety check

    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * video.duration;

    video.currentTime = newTime;
  }, []);

  // Skip forward/backward - memoize to prevent re-renders
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration);
  }, []);

  // If all retry attempts failed, show a user-friendly fallback UI
  if (showFallbackUI) {
    return (
      <div
        className={`instagram-video-container ${className} flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
        style={{ minHeight: '240px' }}
      >
        <div className="text-center p-4 max-w-md">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-4 w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium mb-2 text-gray-800 dark:text-gray-200">Video Unavailable</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Sorry, this video could not be loaded. It may have been removed or is temporarily unavailable.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                // Reset state and try loading again
                setShowFallbackUI(false);
                setLoadAttempts(0);
                if (videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Try Again
            </button>
            {onDoubleClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDoubleClick();
                }}
                className="px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Like Post
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Error: Video file not found (404)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`instagram-video-container ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDoubleClick={(e) => {
        e.preventDefault();
        onDoubleClick && onDoubleClick();
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={usingFallbackVideo ? fallbackVideoUrl : videoSrc}
        poster={usingFallbackVideo ? fallbackPosterUrl : poster}
        className={`w-full h-full object-contain bg-black ${usingFallbackVideo ? 'fallback-video' : ''}`}
        style={{ maxHeight: '100%', maxWidth: '100%', width: 'auto', height: 'auto', ...style }}
        onClick={togglePlay}
        onError={(e) => {
          // Log detailed error information
          debug.error('CustomVideoPlayer: Video error occurred:', {
            src: usingFallbackVideo ? fallbackVideoUrl : videoSrc,
            error: e.currentTarget.error?.message || 'Unknown error',
            code: e.currentTarget.error?.code,
            networkState: e.currentTarget.networkState,
            readyState: e.currentTarget.readyState
          });

          // If we're already using the fallback video and it still fails, show the fallback UI
          if (usingFallbackVideo) {
            setShowFallbackUI(true);
            if (onError) onError();
            return;
          }

          // The error event will be handled by the useEffect error handler
        }}
        loop={loop}
        muted={isMuted}
        playsInline
        preload="auto" // Changed from "none" to "auto" to improve loading
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        autoPlay={autoPlay}
      >
        {/* Fallback source with explicit MIME type */}
        <source src={usingFallbackVideo ? fallbackVideoUrl : videoSrc} type="video/mp4" />
        <source src={usingFallbackVideo ? fallbackVideoUrl : videoSrc} type="video/webm" />
        <source src={usingFallbackVideo ? fallbackVideoUrl : videoSrc} type="video/quicktime" />
      </video>

      {/* Notification when using fallback video */}
      {usingFallbackVideo && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/80 text-white text-xs px-2 py-1 text-center">
          Original video unavailable - Using placeholder video
        </div>
      )}

      {/* Quality indicator (only shown when hovering) */}
      {isHovering && availableQualities.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {selectedQuality.charAt(0).toUpperCase() + selectedQuality.slice(1)}
        </div>
      )}

      {/* Instagram-style play/pause overlay */}
      <div
        className={`instagram-video-overlay ${!isPlaying || isHovering ? 'visible' : ''}`}
      >
        {!isPlaying && (
          <div className="instagram-play-button" onClick={togglePlay} style={{ pointerEvents: 'auto' }}>
            <Play className="text-white w-10 h-10" fill="white" />
          </div>
        )}
      </div>

      {/* Enhanced video controls */}
      {isHovering && (
        <div className="instagram-video-controls">
          <div className="flex items-center gap-2">
            {/* Skip backward button */}
            <button
              onClick={() => skip(-10)}
              className="instagram-control-button"
              title="Skip back 10 seconds"
            >
              <SkipBack size={16} />
            </button>

            {/* Volume button */}
            <button
              onClick={toggleMute}
              className="instagram-control-button"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Skip forward button */}
            <button
              onClick={() => skip(10)}
              className="instagram-control-button"
              title="Skip forward 10 seconds"
            >
              <SkipForward size={16} />
            </button>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className="instagram-control-button"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>

          {/* Time display */}
          <div className="absolute bottom-10 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {/* Instagram-style progress bar */}
      <div
        ref={progressRef}
        className="instagram-progress-container"
        onClick={handleProgressClick}
      >
        <div className="instagram-progress-bar">
          <div
            className="instagram-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

// Memoize the component to prevent unnecessary re-renders
export default memo(CustomVideoPlayer);
