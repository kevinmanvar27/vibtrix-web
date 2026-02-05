import 'package:flutter/material.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/presentation/providers/posts_provider.dart';
import '../providers/reels_provider.dart';

/// Full-screen reels page with vertical scrolling like Instagram
class ReelsPage extends ConsumerStatefulWidget {
  final String? initialPostId;

  const ReelsPage({
    super.key,
    this.initialPostId,
  });

  @override
  ConsumerState<ReelsPage> createState() => _ReelsPageState();
}

class _ReelsPageState extends ConsumerState<ReelsPage> {
  late PageController _pageController;
  
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    
    // Set to full screen immersive mode
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    _pageController.dispose();
    // Restore system UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reelsProvider(widget.initialPostId));

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Reels',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Colors.white),
            )
          : state.reels.isEmpty
              ? _buildEmptyState()
              : PageView.builder(
                  controller: _pageController,
                  scrollDirection: Axis.vertical,
                  itemCount: state.reels.length,
                  onPageChanged: (index) {
                    ref.read(reelsProvider(widget.initialPostId).notifier)
                        .setCurrentIndex(index);
                  },
                  itemBuilder: (context, index) {
                    return ReelItem(
                      reel: state.reels[index],
                      isActive: index == state.currentIndex,
                      onLike: () => ref
                          .read(reelsProvider(widget.initialPostId).notifier)
                          .toggleLike(state.reels[index].id),
                      onBookmark: () => ref
                          .read(reelsProvider(widget.initialPostId).notifier)
                          .toggleBookmark(state.reels[index].id),
                      onCommentAdded: () {
                        // Refresh the reel's comment count
                        ref.read(reelsProvider(widget.initialPostId).notifier)
                            .refreshReelCommentCount(state.reels[index].id);
                      },
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.video_library_outlined,
            size: 80,
            color: Colors.grey[600],
          ),
          const SizedBox(height: 16),
          Text(
            'No reels available',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Check back later for new content',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

/// Individual reel item with video player and overlay
class ReelItem extends ConsumerStatefulWidget {
  final PostModel reel;
  final bool isActive;
  final VoidCallback onLike;
  final VoidCallback onBookmark;
  final VoidCallback? onCommentAdded;

  const ReelItem({
    super.key,
    required this.reel,
    required this.isActive,
    required this.onLike,
    required this.onBookmark,
    this.onCommentAdded,
  });

  @override
  ConsumerState<ReelItem> createState() => _ReelItemState();
}

class _ReelItemState extends ConsumerState<ReelItem> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = false;
  bool _showPlayPause = false;
  bool _isMuted = false;

  @override
  void initState() {
    super.initState();
    if (widget.isActive) {
      _initializeVideo();
    }
  }

  @override
  void didUpdateWidget(ReelItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive && !oldWidget.isActive) {
      // Became active - initialize and play
      _initializeVideo();
    } else if (!widget.isActive && oldWidget.isActive) {
      // Became inactive - pause
      _controller?.pause();
      setState(() {
        _isPlaying = false;
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    if (_controller != null) {
      // Already initialized, just play
      _controller!.play();
      setState(() {
        _isPlaying = true;
      });
      return;
    }

    final videoUrl = widget.reel.media?.url;
    if (videoUrl == null) return;

    try {
      final fullUrl = UrlUtils.getFullMediaUrl(videoUrl);
      _controller = VideoPlayerController.networkUrl(Uri.parse(fullUrl));
      
      await _controller!.initialize();
      _controller!.setLooping(true);
      _controller!.setVolume(_isMuted ? 0.0 : 1.0);
      
      if (mounted && widget.isActive) {
        _controller!.play();
        setState(() {
          _isInitialized = true;
          _isPlaying = true;
        });
      }
    } catch (e) {
      debugPrint('Error initializing reel video: $e');
    }
  }

  void _togglePlayPause() {
    if (_controller == null || !_isInitialized) return;

    setState(() {
      if (_controller!.value.isPlaying) {
        _controller!.pause();
        _isPlaying = false;
      } else {
        _controller!.play();
        _isPlaying = true;
      }
      _showPlayPause = true;
    });

    // Hide play/pause indicator after a delay
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() {
          _showPlayPause = false;
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

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlayPause,
      onDoubleTap: () {
        if (!widget.reel.isLiked) {
          widget.onLike();
          // Show heart animation
          _showLikeAnimation();
        }
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video player
          _buildVideoPlayer(),
          
          // Gradient overlay for better text visibility
          _buildGradientOverlay(),
          
          // Play/Pause and Mute indicator (center)
          if (_showPlayPause)
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Play/Pause button
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      color: Colors.white,
                      size: 50,
                    ),
                  ),
                  const SizedBox(width: 20),
                  // Mute/Unmute button
                  GestureDetector(
                    onTap: _toggleMute,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _isMuted ? Icons.volume_off : Icons.volume_up,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          
          // Right side action buttons
          _buildActionButtons(),
          
          // Bottom info (user, caption, music)
          _buildBottomInfo(),
        ],
      ),
    );
  }

  Widget _buildVideoPlayer() {
    if (!_isInitialized || _controller == null) {
      // Show thumbnail while loading
      final thumbnailUrl = widget.reel.media?.thumbnailUrl;
      return Stack(
        fit: StackFit.expand,
        children: [
          if (thumbnailUrl != null)
            Image.network(
              UrlUtils.getFullMediaUrl(thumbnailUrl),
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(color: Colors.black),
            )
          else
            Container(color: Colors.black),
          const Center(
            child: CircularProgressIndicator(color: Colors.white),
          ),
        ],
      );
    }

    return FittedBox(
      fit: BoxFit.cover,
      child: SizedBox(
        width: _controller!.value.size.width,
        height: _controller!.value.size.height,
        child: VideoPlayer(_controller!),
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.3),
              Colors.transparent,
              Colors.transparent,
              Colors.black.withOpacity(0.7),
            ],
            stops: const [0.0, 0.2, 0.6, 1.0],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    final reel = widget.reel;
    
    return Positioned(
      right: 12,
      bottom: 60,
      child: Column(
        children: [
          // Like button
          _ActionButton(
            icon: reel.isLiked ? Icons.favorite : Icons.favorite_border,
            label: _formatCount(reel.likesCount),
            color: reel.isLiked ? Colors.red : Colors.white,
            onTap: widget.onLike,
          ),
          const SizedBox(height: 16),
          
          // Comment button
          _ActionButton(
            icon: Icons.chat_bubble_outline,
            label: _formatCount(reel.commentsCount),
            onTap: () {
              // Show comments sheet
              _showCommentsSheet();
            },
          ),
          const SizedBox(height: 16),
          
          // Share button
          _ActionButton(
            icon: Icons.send,
            label: _formatCount(reel.sharesCount),
            onTap: () {
              Share.share(
                'Check out this reel on VidiBattle: https://vidibattle.com/post/${reel.id}',
              );
            },
          ),
          const SizedBox(height: 16),
          
          // Bookmark button
          _ActionButton(
            icon: reel.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
            label: '',
            color: reel.isBookmarked ? Colors.amber : Colors.white,
            onTap: widget.onBookmark,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomInfo() {
    final reel = widget.reel;
    final user = reel.user;
    
    return Positioned(
      left: 12,
      right: 80,
      bottom: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Username
          GestureDetector(
            onTap: () => context.push('/user/${reel.userId}'),
            child: Row(
              children: [
                Text(
                  '@${user?.username ?? 'unknown'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (user?.isVerified ?? false) ...[
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.verified,
                    color: Colors.blue,
                    size: 16,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          
          // Caption
          if (reel.caption != null && reel.caption!.isNotEmpty)
            Text(
              reel.caption!,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          
          // Hashtags
          if (reel.hashtags != null && reel.hashtags!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Wrap(
              spacing: 4,
              children: reel.hashtags!.take(3).map((tag) {
                return Text(
                  '#$tag',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                );
              }).toList(),
            ),
          ],
          
          const SizedBox(height: 12),
          
          // Music/Audio info (placeholder)
          Row(
            children: [
              const Icon(Icons.music_note, color: Colors.white, size: 14),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'Original audio - ${user?.name ?? 'Unknown'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showCommentsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReelCommentsSheet(
        postId: widget.reel.id,
        onCommentAdded: widget.onCommentAdded,
      ),
    );
  }

  void _showLikeAnimation() {
    // TODO: Add heart animation overlay
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

/// Action button widget for reels
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    this.color = Colors.white,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ============================================================================
// Reel Comments Sheet
// ============================================================================

/// Bottom sheet for displaying and adding comments on reels
class _ReelCommentsSheet extends ConsumerStatefulWidget {
  final String postId;
  final VoidCallback? onCommentAdded;

  const _ReelCommentsSheet({
    required this.postId,
    this.onCommentAdded,
  });

  @override
  ConsumerState<_ReelCommentsSheet> createState() => _ReelCommentsSheetState();
}

class _ReelCommentsSheetState extends ConsumerState<_ReelCommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);
    
    final success = await ref.read(postDetailProvider(widget.postId).notifier)
        .addComment(widget.postId, content);
    
    setState(() => _isSubmitting = false);
    
    if (success) {
      _commentController.clear();
      _focusNode.unfocus();
      widget.onCommentAdded?.call();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment added!'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to add comment'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final state = ref.watch(postDetailProvider(widget.postId));
    final currentUser = ref.watch(authProvider).user;
    
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Comments',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Divider(height: 1),
            // Comments list
            Expanded(
              child: state.isLoadingComments && state.comments.isEmpty
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    )
                  : state.comments.isEmpty
                      ? _buildEmptyState(theme)
                      : ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: state.comments.length,
                          itemBuilder: (context, index) {
                            final comment = state.comments[index];
                            return _buildCommentTile(comment, theme);
                          },
                        ),
            ),
            // Comment input
            SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  border: Border(
                    top: BorderSide(
                      color: theme.dividerColor.withOpacity(0.1),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    NetworkAvatar(
                      imageUrl: currentUser?.profilePicture,
                      radius: 18,
                      fallbackText: currentUser?.username ?? 'U',
                      backgroundColor: AppColors.primary.withOpacity(0.2),
                      foregroundColor: AppColors.primary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        focusNode: _focusNode,
                        decoration: InputDecoration(
                          hintText: 'Add a comment...',
                          hintStyle: TextStyle(
                            color: theme.colorScheme.onSurface.withOpacity(0.4),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: isDark 
                              ? Colors.white.withOpacity(0.1)
                              : Colors.black.withOpacity(0.05),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _submitComment(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _isSubmitting
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : IconButton(
                            icon: const Icon(Icons.send_rounded),
                            color: AppColors.primary,
                            onPressed: _submitComment,
                          ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: theme.colorScheme.onSurface.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No comments yet',
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to comment!',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentTile(CommentModel comment, ThemeData theme) {
    final user = comment.user;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          NetworkAvatar(
            imageUrl: user?.profilePicture,
            radius: 18,
            fallbackText: user?.name ?? user?.username ?? 'U',
            backgroundColor: AppColors.primary.withOpacity(0.2),
            foregroundColor: AppColors.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: theme.textTheme.bodyMedium,
                    children: [
                      TextSpan(
                        text: user?.username ?? 'user',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      if (user?.isVerified ?? false)
                        const WidgetSpan(
                          child: Padding(
                            padding: EdgeInsets.only(left: 4),
                            child: Icon(
                              Icons.verified,
                              size: 14,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      TextSpan(text: '  ${comment.content}'),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      timeago.format(comment.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ),
                    if (comment.likesCount > 0) ...[
                      const SizedBox(width: 16),
                      Text(
                        '${comment.likesCount} likes',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              Icons.favorite_border,
              size: 16,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
            onPressed: () {
              // TODO: Implement comment like
            },
          ),
        ],
      ),
    );
  }
}
