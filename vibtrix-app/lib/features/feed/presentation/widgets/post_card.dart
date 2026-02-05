import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../posts/data/models/post_model.dart';
import '../providers/feed_provider.dart';
import 'video_player_widget.dart';

/// Post card widget for displaying a single post in the feed
class PostCard extends ConsumerStatefulWidget {
  final PostModel post;
  final VoidCallback? onTap;
  final VoidCallback? onUserTap;
  final VoidCallback? onCommentTap;
  final VoidCallback? onShareTap;

  const PostCard({
    super.key,
    required this.post,
    this.onTap,
    this.onUserTap,
    this.onCommentTap,
    this.onShareTap,
  });

  @override
  ConsumerState<PostCard> createState() => _PostCardState();
}

class _PostCardState extends ConsumerState<PostCard> {
  bool _isCaptionExpanded = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  String _getFullUrl(String url) {
    return UrlUtils.getFullMediaUrl(url);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final hasMedia = widget.post.media != null;
    final isTextOnly = !hasMedia && widget.post.caption != null && widget.post.caption!.isNotEmpty;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      elevation: 0,
      color: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(0),
      ),
      child: InkWell(
        onTap: widget.onTap,
        onDoubleTap: _handleDoubleTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User header
            _buildUserHeader(theme),
            
            // Text-only content (Twitter style) or Media content
            if (isTextOnly)
              _buildTextOnlyContent(theme)
            else if (hasMedia)
              _buildMediaContent(theme),
            
            // Caption (only show separately if there's media)
            if (hasMedia && widget.post.caption != null && widget.post.caption!.isNotEmpty)
              _buildCaption(theme),
            
            // Action buttons
            _buildActionButtons(theme),
            
            // Likes count
            _buildLikesCount(theme),
            
            // Comments preview
            if (widget.post.commentsCount > 0)
              _buildCommentsPreview(theme),
            
            // Timestamp
            _buildTimestamp(theme),
            
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  /// Build text-only post content like Twitter
  Widget _buildTextOnlyContent(ThemeData theme) {
    final caption = widget.post.caption ?? '';
    final isLongText = caption.length > 280;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main text content
          Text(
            caption,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontSize: caption.length < 100 ? 18 : 16,
              height: 1.4,
            ),
            maxLines: _isCaptionExpanded ? null : 12,
            overflow: _isCaptionExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
          ),
          
          // Show more button for long text
          if (isLongText && !_isCaptionExpanded)
            GestureDetector(
              onTap: () {
                setState(() {
                  _isCaptionExpanded = true;
                });
              },
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Show more',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          
          // Hashtags as clickable chips
          if (widget.post.hashtags != null && widget.post.hashtags!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: widget.post.hashtags!.map((tag) {
                return GestureDetector(
                  onTap: () {
                    // Navigate to hashtag search
                    context.push('/search?q=%23$tag');
                  },
                  child: Text(
                    '#$tag',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildUserHeader(ThemeData theme) {
    final user = widget.post.user;
    
    return InkWell(
      onTap: widget.onUserTap,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Avatar - handles both SVG and regular images
            NetworkAvatar(
              imageUrl: user?.profilePicture != null 
                  ? _getFullUrl(user!.profilePicture!) 
                  : null,
              radius: 18,
              fallbackText: user?.name ?? user?.username ?? 'U',
              backgroundColor: AppColors.primary.withValues(alpha: 0.2),
              foregroundColor: AppColors.primary,
            ),
            const SizedBox(width: 12),
            
            // Username and display name
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user?.name ?? user?.username ?? 'Unknown',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (user?.username != null)
                    Text(
                      '@${user!.username}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                ],
              ),
            ),
            
            // More options
            IconButton(
              icon: const Icon(Icons.more_vert),
              onPressed: () => _showPostOptions(context),
              iconSize: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaContent(ThemeData theme) {
    final media = widget.post.media;
    
    if (media == null) {
      return const SizedBox.shrink();
    }

    // For videos, use a fixed aspect ratio (4:5 like Instagram) to ensure consistent card sizes
    // For images, use the actual aspect ratio but constrain to reasonable bounds
    final double aspectRatio;
    if (media.isVideo) {
      // Fixed 4:5 aspect ratio for videos (Instagram standard)
      aspectRatio = 4 / 5;
    } else {
      // For images, use actual ratio but clamp between 4:5 and 1.91:1
      final actualRatio = media.width != null && media.height != null
          ? media.width! / media.height!
          : 1.0;
      aspectRatio = actualRatio.clamp(0.8, 1.91);
    }

    if (media.isVideo) {
      return ClipRRect(
        child: AspectRatio(
          aspectRatio: aspectRatio,
          child: FeedVideoPlayer(
            videoUrl: media.url,
            thumbnailUrl: media.thumbnailUrl,
            aspectRatio: aspectRatio,
            onTap: widget.onTap,
            onDoubleTap: _handleDoubleTap,
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: widget.onTap,
      onDoubleTap: _handleDoubleTap,
      child: AspectRatio(
        aspectRatio: aspectRatio,
        child: _buildImage(media),
      ),
    );
  }

  Widget _buildImage(PostMediaModel media) {
    return CachedNetworkImage(
      imageUrl: _getFullUrl(media.url),
      fit: BoxFit.cover,
      placeholder: (context, url) => Container(
        color: AppColors.darkMuted,
        child: const Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
          ),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        color: AppColors.darkMuted,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, color: AppColors.error, size: 32),
            const SizedBox(height: 8),
            Text(
              'Failed to load image',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          // Like button
          _ActionButton(
            icon: widget.post.isLiked ? Icons.favorite : Icons.favorite_border,
            color: widget.post.isLiked ? AppColors.like : null,
            onPressed: () => _handleLike(),
          ),
          
          // Comment button
          _ActionButton(
            icon: Icons.chat_bubble_outline,
            onPressed: widget.onCommentTap,
          ),
          
          // Share button
          _ActionButton(
            icon: Icons.send_outlined,
            onPressed: widget.onShareTap,
          ),
          
          const Spacer(),
          
          // Bookmark button
          _ActionButton(
            icon: widget.post.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
            color: widget.post.isBookmarked ? AppColors.bookmark : null,
            onPressed: () => _handleBookmark(),
          ),
        ],
      ),
    );
  }

  Widget _buildLikesCount(ThemeData theme) {
    if (widget.post.likesCount == 0) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        '${_formatCount(widget.post.likesCount)} likes',
        style: theme.textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildCaption(ThemeData theme) {
    final user = widget.post.user;
    final caption = widget.post.caption ?? '';
    final shouldTruncate = caption.length > 100;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: theme.textTheme.bodyMedium,
              children: [
                TextSpan(
                  text: '${user?.username ?? 'user'} ',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: caption),
              ],
            ),
            maxLines: _isCaptionExpanded ? null : 2,
            overflow: _isCaptionExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
          ),
          if (shouldTruncate && !_isCaptionExpanded)
            GestureDetector(
              onTap: () {
                setState(() {
                  _isCaptionExpanded = true;
                });
              },
              child: Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  'more',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCommentsPreview(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: GestureDetector(
        onTap: widget.onCommentTap,
        child: Text(
          'View all ${_formatCount(widget.post.commentsCount)} comments',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }

  Widget _buildTimestamp(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: Text(
        timeago.format(widget.post.createdAt),
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
          fontSize: 11,
        ),
      ),
    );
  }

  void _handleLike() {
    final notifier = ref.read(feedProvider.notifier);
    if (widget.post.isLiked) {
      notifier.unlikePost(widget.post.id);
    } else {
      notifier.likePost(widget.post.id);
    }
  }

  void _handleBookmark() {
    final notifier = ref.read(feedProvider.notifier);
    if (widget.post.isBookmarked) {
      notifier.unsavePost(widget.post.id);
    } else {
      notifier.savePost(widget.post.id);
    }
  }

  void _handleDoubleTap() {
    if (!widget.post.isLiked) {
      _handleLike();
      // TODO: Show heart animation
    }
  }

  void _showPostOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share'),
              onTap: () {
                Navigator.pop(context);
                widget.onShareTap?.call();
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Copy link'),
              onTap: () {
                Navigator.pop(context);
                final link = 'https://vidibattle.com/post/${widget.post.id}';
                Clipboard.setData(ClipboardData(text: link));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied to clipboard')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.report_outlined),
              title: const Text('Report'),
              onTap: () {
                Navigator.pop(context);
                context.push(RouteNames.reportPostPath(widget.post.id));
              },
            ),
          ],
        ),
      ),
    );
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

/// Simple action button for post interactions
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color? color;
  final VoidCallback? onPressed;

  const _ActionButton({
    required this.icon,
    this.color,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(icon),
      color: color,
      onPressed: onPressed,
      iconSize: 26,
      padding: const EdgeInsets.all(8),
      constraints: const BoxConstraints(),
    );
  }
}
