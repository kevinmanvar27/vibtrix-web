import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:visibility_detector/visibility_detector.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/url_utils.dart';

/// A reusable video player widget with full controls using Chewie
class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final String? thumbnailUrl;
  final double? aspectRatio;
  final bool autoPlay;
  final bool looping;
  final bool showControls;
  final bool pauseOnInvisible;
  final VoidCallback? onTap;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.thumbnailUrl,
    this.aspectRatio,
    this.autoPlay = false,
    this.looping = true,
    this.showControls = true,
    this.pauseOnInvisible = true,
    this.onTap,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _isInitialized = false;
  bool _hasError = false;
  String? _errorMessage;
  bool _isVisible = false;
  bool _wasPlayingBeforeInvisible = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  @override
  void didUpdateWidget(VideoPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeControllers();
      _initializeVideo();
    }
  }

  @override
  void dispose() {
    _disposeControllers();
    super.dispose();
  }

  void _disposeControllers() {
    _chewieController?.dispose();
    _chewieController = null;
    _videoController?.dispose();
    _videoController = null;
    _isInitialized = false;
  }

  Future<void> _initializeVideo() async {
    setState(() {
      _hasError = false;
      _errorMessage = null;
      _isInitialized = false;
    });

    try {
      final fullUrl = UrlUtils.getFullMediaUrl(widget.videoUrl);
      debugPrint('🎬 Initializing video: $fullUrl');

      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(fullUrl),
        videoPlayerOptions: VideoPlayerOptions(
          mixWithOthers: true,
          allowBackgroundPlayback: false,
        ),
      );

      await _videoController!.initialize();

      if (!mounted) return;

      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        aspectRatio: widget.aspectRatio ?? _videoController!.value.aspectRatio,
        autoPlay: widget.autoPlay,
        looping: widget.looping,
        showControls: widget.showControls,
        allowFullScreen: true,
        allowMuting: true,
        allowPlaybackSpeedChanging: false,
        placeholder: _buildPlaceholder(),
        errorBuilder: (context, errorMessage) {
          return _buildErrorWidget(errorMessage);
        },
        materialProgressColors: ChewieProgressColors(
          playedColor: AppColors.primary,
          handleColor: AppColors.primary,
          backgroundColor: Colors.grey.shade800,
          bufferedColor: Colors.grey.shade600,
        ),
        customControls: const MaterialControls(),
      );

      setState(() {
        _isInitialized = true;
      });

      debugPrint('✅ Video initialized successfully');
    } catch (e) {
      debugPrint('❌ Error initializing video: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = e.toString();
        });
      }
    }
  }

  void _onVisibilityChanged(VisibilityInfo info) {
    if (!widget.pauseOnInvisible) return;

    final wasVisible = _isVisible;
    _isVisible = info.visibleFraction > 0.5;

    if (_videoController == null || !_isInitialized) return;

    if (!_isVisible && wasVisible) {
      // Became invisible - pause if playing
      if (_videoController!.value.isPlaying) {
        _wasPlayingBeforeInvisible = true;
        _videoController!.pause();
      }
    } else if (_isVisible && !wasVisible) {
      // Became visible - resume if was playing before
      if (_wasPlayingBeforeInvisible && widget.autoPlay) {
        _videoController!.play();
        _wasPlayingBeforeInvisible = false;
      }
    }
  }

  Widget _buildPlaceholder() {
    if (widget.thumbnailUrl != null && widget.thumbnailUrl!.isNotEmpty) {
      final thumbnailFullUrl = UrlUtils.getFullMediaUrl(widget.thumbnailUrl!);
      return Image.network(
        thumbnailFullUrl,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (context, error, stackTrace) {
          return _buildLoadingPlaceholder();
        },
      );
    }
    return _buildLoadingPlaceholder();
  }

  Widget _buildLoadingPlaceholder() {
    return Container(
      color: AppColors.darkMuted,
      child: const Center(
        child: CircularProgressIndicator(
          color: AppColors.primary,
          strokeWidth: 2,
        ),
      ),
    );
  }

  Widget _buildErrorWidget(String errorMessage) {
    return Container(
      color: AppColors.darkMuted,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              color: AppColors.error,
              size: 48,
            ),
            const SizedBox(height: 16),
            const Text(
              'Failed to load video',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                errorMessage,
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _initializeVideo,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget content;

    if (_hasError) {
      content = _buildErrorWidget(_errorMessage ?? 'Unknown error');
    } else if (!_isInitialized || _chewieController == null) {
      content = Stack(
        fit: StackFit.expand,
        children: [
          _buildPlaceholder(),
          const Center(
            child: CircularProgressIndicator(
              color: AppColors.primary,
              strokeWidth: 2,
            ),
          ),
        ],
      );
    } else {
      content = GestureDetector(
        onTap: widget.onTap,
        child: Chewie(controller: _chewieController!),
      );
    }

    if (widget.pauseOnInvisible) {
      return VisibilityDetector(
        key: Key('video-${widget.videoUrl.hashCode}'),
        onVisibilityChanged: _onVisibilityChanged,
        child: content,
      );
    }

    return content;
  }
}

/// Instagram-style video player for feed posts
/// Auto-plays when visible, pauses when scrolled away
class FeedVideoPlayer extends StatefulWidget {
  final String videoUrl;
  final String? thumbnailUrl;
  final double? aspectRatio;
  final VoidCallback? onTap;
  final VoidCallback? onDoubleTap;

  const FeedVideoPlayer({
    super.key,
    required this.videoUrl,
    this.thumbnailUrl,
    this.aspectRatio,
    this.onTap,
    this.onDoubleTap,
  });

  @override
  State<FeedVideoPlayer> createState() => _FeedVideoPlayerState();
}

class _FeedVideoPlayerState extends State<FeedVideoPlayer> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = false;
  bool _hasError = false;
  bool _showControls = false; // Hidden by default like Instagram
  bool _isMuted = true; // Muted by default like Instagram
  bool _isVisible = false;
  bool _userPaused = false; // Track if user manually paused

  @override
  void initState() {
    super.initState();
    // Don't initialize immediately - wait for visibility
  }

  @override
  void dispose() {
    _controller?.removeListener(_videoListener);
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    if (_controller != null) return; // Already initialized
    
    try {
      final fullUrl = UrlUtils.getFullMediaUrl(widget.videoUrl);
      debugPrint('🎬 FeedVideoPlayer initializing: $fullUrl');

      _controller = VideoPlayerController.networkUrl(Uri.parse(fullUrl));
      
      await _controller!.initialize();
      _controller!.setLooping(true);
      _controller!.setVolume(0.0); // Start muted like Instagram
      
      // Add listener for playback state changes
      _controller!.addListener(_videoListener);

      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
        
        // Auto-play if visible
        if (_isVisible && !_userPaused) {
          _controller!.play();
        }
      }
      debugPrint('✅ FeedVideoPlayer initialized');
    } catch (e) {
      debugPrint('❌ FeedVideoPlayer error: $e');
      if (mounted) {
        setState(() {
          _hasError = true;
        });
      }
    }
  }

  void _onVisibilityChanged(VisibilityInfo info) {
    final wasVisible = _isVisible;
    // Consider visible if more than 50% is showing
    _isVisible = info.visibleFraction > 0.5;

    if (_isVisible && !wasVisible) {
      // Became visible - initialize and play
      if (!_isInitialized) {
        _initializeVideo();
      } else if (_controller != null && !_userPaused) {
        _controller!.play();
        if (mounted) {
          setState(() {
            _isPlaying = true;
          });
        }
      }
    } else if (!_isVisible && wasVisible) {
      // Became invisible - pause
      if (_controller != null && _isInitialized) {
        _controller!.pause();
        if (mounted) {
          setState(() {
            _isPlaying = false;
          });
        }
      }
    }
  }

  void _videoListener() {
    if (!mounted || _controller == null) return;
    final isPlaying = _controller!.value.isPlaying;
    if (isPlaying != _isPlaying) {
      setState(() {
        _isPlaying = isPlaying;
      });
    }
  }

  void _togglePlayPause() {
    if (_controller == null || !_isInitialized) return;

    setState(() {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
        _isPlaying = false;
        _userPaused = true; // User manually paused
        _showControls = true; // Show controls when paused
      } else {
        _controller!.play();
        _isPlaying = true;
        _userPaused = false; // User resumed
        // Hide controls after starting playback
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && _isPlaying) {
            setState(() {
              _showControls = false;
            });
          }
        });
      }
    });
  }

  void _toggleMute() {
    if (_controller == null) return;
    setState(() {
      _isMuted = !_isMuted;
      _controller!.setVolume(_isMuted ? 0.0 : 1.0);
    });
  }

  void _onTap() {
    // Navigate to full screen reels view on tap
    if (widget.onTap != null) {
      widget.onTap!();
    }
  }

  @override
  Widget build(BuildContext context) {
    return VisibilityDetector(
      key: Key('feed-video-${widget.videoUrl.hashCode}'),
      onVisibilityChanged: _onVisibilityChanged,
      child: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_hasError) {
      return _buildErrorWidget();
    }

    if (!_isInitialized || _controller == null) {
      return _buildLoadingWidget();
    }

    return GestureDetector(
      onTap: _onTap,
      onDoubleTap: widget.onDoubleTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video player
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller!.value.size.width,
              height: _controller!.value.size.height,
              child: VideoPlayer(_controller!),
            ),
          ),

          // Mute button (bottom right) - always visible like Instagram
          Positioned(
            bottom: 12,
            right: 12,
            child: GestureDetector(
              onTap: _toggleMute,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isMuted ? Icons.volume_off : Icons.volume_up,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ),

          // Play/Pause indicator (shows briefly when tapped)
          AnimatedOpacity(
            opacity: _showControls ? 1.0 : 0.0,
            duration: const Duration(milliseconds: 200),
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isPlaying ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          ),

          // Progress bar (bottom) - thin like Instagram
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SizedBox(
              height: 2,
              child: VideoProgressIndicator(
                _controller!,
                allowScrubbing: false,
                padding: EdgeInsets.zero,
                colors: const VideoProgressColors(
                  playedColor: Colors.white,
                  bufferedColor: Colors.white38,
                  backgroundColor: Colors.white24,
                ),
              ),
            ),
          ),
          
          // Reels indicator (top right) - shows this opens reels view
          Positioned(
            top: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.play_circle_outline, color: Colors.white, size: 16),
                  SizedBox(width: 4),
                  Text(
                    'Reels',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Thumbnail
        if (widget.thumbnailUrl != null)
          Image.network(
            UrlUtils.getFullMediaUrl(widget.thumbnailUrl!),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: AppColors.darkMuted),
          )
        else
          Container(color: AppColors.darkMuted),
        
        // Loading indicator (subtle like Instagram)
        Center(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              shape: BoxShape.circle,
            ),
            child: const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorWidget() {
    return GestureDetector(
      onTap: () {
        setState(() {
          _hasError = false;
        });
        _initializeVideo();
      },
      child: Container(
        color: AppColors.darkMuted,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.play_circle_outline,
                color: Colors.white.withOpacity(0.7),
                size: 48,
              ),
              const SizedBox(height: 8),
              Text(
                'Tap to retry',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
