import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../feed/presentation/widgets/video_player_widget.dart';
import '../../data/models/post_model.dart';
import '../providers/posts_provider.dart';
import 'comments_page.dart';

/// Detailed view of a single post with comments
class PostDetailPage extends ConsumerStatefulWidget {
  final String postId;
  
  const PostDetailPage({
    super.key,
    required this.postId,
  });

  @override
  ConsumerState<PostDetailPage> createState() => _PostDetailPageState();
}

class _PostDetailPageState extends ConsumerState<PostDetailPage> {
  @override
  void initState() {
    super.initState();
    // Load post on init
    Future.microtask(() {
      ref.read(postDetailProvider(widget.postId).notifier).loadPost(widget.postId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(postDetailProvider(widget.postId));
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : state.post == null
              ? _buildNotFound()
              : _buildPostContent(state),
    );
  }

  Widget _buildNotFound() {
    return SafeArea(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
            ),
            const SizedBox(height: 32),
            Icon(Icons.error_outline, size: 80, color: Colors.grey.shade600),
            const SizedBox(height: 16),
            Text(
              'Post not found',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'This post may have been deleted',
              style: TextStyle(color: Colors.grey.shade400),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostContent(PostDetailState state) {
    final post = state.post!;
    final currentUser = ref.watch(authProvider).user;
    final isOwner = currentUser?.id == post.userId;
    final isVideo = post.media?.type?.toLowerCase() == 'video';
    final hasMedia = post.media != null && post.media!.url.isNotEmpty;
    // Use URL utility to get full URL for media
    final mediaUrl = UrlUtils.getPostThumbnailUrl(post.media?.thumbnailUrl, post.media?.url);
    final user = post.user;

    // Text-only posts get a different layout
    if (!hasMedia) {
      return _buildTextOnlyPostContent(post, user, isOwner);
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Media (Image/Video)
        GestureDetector(
          onDoubleTap: () {
            if (!post.isLiked) {
              ref.read(postDetailProvider(widget.postId).notifier).toggleLike();
            }
          },
          child: isVideo && post.media?.url != null
              ? VideoPlayerWidget(
                  videoUrl: post.media!.url,
                  thumbnailUrl: post.media?.thumbnailUrl,
                  autoPlay: true,
                  looping: true,
                  showControls: true,
                )
              : CachedNetworkImage(
                  imageUrl: mediaUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey.shade900,
                    child: const Icon(Icons.error, color: Colors.white, size: 48),
                  ),
                ),
        ),

        // Top bar
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => _showMoreOptions(post, isOwner),
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Bottom content
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.8),
                  Colors.transparent,
                ],
              ),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // User info
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.push('/user/${post.userId}'),
                        child: NetworkAvatar(
                          imageUrl: user?.profilePicture,
                          fallbackText: user?.name ?? user?.username ?? 'U',
                          radius: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => context.push('/user/${post.userId}'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    user?.name ?? user?.username ?? 'Unknown',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
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
                              Text(
                                timeago.format(post.createdAt),
                                style: TextStyle(
                                  color: Colors.grey.shade400,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Follow button
                      if (!isOwner)
                        OutlinedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Following user')),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                          ),
                          child: const Text('Follow'),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Caption
                  if (post.caption != null && post.caption!.isNotEmpty)
                    Text(
                      post.caption!,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),

                  // Hashtags
                  if (post.hashtags != null && post.hashtags!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: post.hashtags!.take(5).map((tag) {
                        return GestureDetector(
                          onTap: () {
                            context.push('/search?q=$tag');
                          },
                          child: Text(
                            '#$tag',
                            style: const TextStyle(
                              color: Colors.lightBlueAccent,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Action buttons
                  Row(
                    children: [
                      // Like
                      _buildActionButton(
                        icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                        label: _formatCount(post.likesCount),
                        color: post.isLiked ? Colors.red : Colors.white,
                        onTap: () {
                          ref.read(postDetailProvider(widget.postId).notifier).toggleLike();
                        },
                      ),
                      const SizedBox(width: 24),
                      // Comments
                      _buildActionButton(
                        icon: Icons.chat_bubble_outline,
                        label: _formatCount(post.commentsCount),
                        onTap: () {
                          _showCommentsSheet();
                        },
                      ),
                      const SizedBox(width: 24),
                      // Share
                      _buildActionButton(
                        icon: Icons.share_outlined,
                        label: _formatCount(post.sharesCount),
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Share options')),
                          );
                        },
                      ),
                      const Spacer(),
                      // Bookmark
                      IconButton(
                        onPressed: () {
                          ref.read(postDetailProvider(widget.postId).notifier).toggleSave();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(post.isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks'),
                              duration: const Duration(seconds: 1),
                            ),
                          );
                        },
                        icon: Icon(
                          post.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                          color: post.isBookmarked ? Colors.amber : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Build text-only post content (Twitter-style)
  Widget _buildTextOnlyPostContent(PostModel post, dynamic user, bool isOwner) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? Colors.black : Colors.white,
      appBar: AppBar(
        backgroundColor: isDark ? Colors.black : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black,
        elevation: 0,
        title: const Text('Post'),
        actions: [
          IconButton(
            onPressed: () => _showMoreOptions(post, isOwner),
            icon: const Icon(Icons.more_vert),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.push('/user/${post.userId}'),
                    child: NetworkAvatar(
                      imageUrl: user?.profilePicture,
                      fallbackText: user?.name ?? user?.username ?? 'U',
                      radius: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => context.push('/user/${post.userId}'),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                user?.name ?? user?.username ?? 'Unknown',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
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
                          Text(
                            '@${user?.username ?? 'unknown'}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Main text content - Twitter style
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                post.caption ?? '',
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontSize: (post.caption?.length ?? 0) < 100 ? 22 : 18,
                  height: 1.4,
                ),
              ),
            ),
            
            // Hashtags
            if (post.hashtags != null && post.hashtags!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: post.hashtags!.map((tag) {
                    return GestureDetector(
                      onTap: () => context.push('/search?q=%23$tag'),
                      child: Text(
                        '#$tag',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
            
            // Timestamp
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                timeago.format(post.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.grey,
                ),
              ),
            ),
            
            const Divider(),
            
            // Stats row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Text(
                    '${_formatCount(post.likesCount)} likes',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    '${_formatCount(post.commentsCount)} comments',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    '${_formatCount(post.sharesCount)} shares',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            
            const Divider(),
            
            // Action buttons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  IconButton(
                    onPressed: () {
                      ref.read(postDetailProvider(widget.postId).notifier).toggleLike();
                    },
                    icon: Icon(
                      post.isLiked ? Icons.favorite : Icons.favorite_border,
                      color: post.isLiked ? Colors.red : null,
                    ),
                  ),
                  IconButton(
                    onPressed: _showCommentsSheet,
                    icon: const Icon(Icons.chat_bubble_outline),
                  ),
                  IconButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Share options')),
                      );
                    },
                    icon: const Icon(Icons.share_outlined),
                  ),
                  IconButton(
                    onPressed: () {
                      ref.read(postDetailProvider(widget.postId).notifier).toggleSave();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(post.isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                    icon: Icon(
                      post.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                      color: post.isBookmarked ? Colors.amber : null,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color color = Colors.white,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w500),
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
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: CommentsPage(
            postId: widget.postId,
            scrollController: scrollController,
          ),
        ),
      ),
    );
  }

  void _showMoreOptions(PostModel post, bool isOwner) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Copy link'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share to...'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Share options')),
                );
              },
            ),
            if (!isOwner) ...[
              ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: const Text('Report'),
                onTap: () {
                  Navigator.pop(context);
                  context.push('/report/post/${widget.postId}');
                },
              ),
              ListTile(
                leading: const Icon(Icons.block),
                title: const Text('Block user'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('User blocked')),
                  );
                },
              ),
            ] else ...[
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Edit post'),
                onTap: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Edit post')),
                  );
                },
              ),
              ListTile(
                leading: Icon(Icons.delete, color: Colors.red.shade400),
                title: Text('Delete post', style: TextStyle(color: Colors.red.shade400)),
                onTap: () {
                  Navigator.pop(context);
                  _showDeleteConfirmation();
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post?'),
        content: const Text('This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Post deleted')),
              );
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
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
