import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/post_model.dart';
import '../providers/posts_provider.dart';

/// Page showing comments for a post
class CommentsPage extends ConsumerStatefulWidget {
  final String postId;
  final ScrollController? scrollController;
  
  const CommentsPage({
    super.key,
    required this.postId,
    this.scrollController,
  });

  @override
  ConsumerState<CommentsPage> createState() => _CommentsPageState();
}

class _CommentsPageState extends ConsumerState<CommentsPage> {
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

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Comments'),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
      ),
      body: state.isLoadingComments && state.comments.isEmpty
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : state.comments.isEmpty
              ? _buildEmptyState(theme)
              : _buildCommentsList(state.comments, theme, isDark),
      bottomNavigationBar: _buildCommentInput(theme, isDark),
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
            color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No comments yet',
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to comment!',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsList(List<CommentModel> comments, ThemeData theme, bool isDark) {
    return ListView.builder(
      controller: widget.scrollController,
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: comments.length,
      itemBuilder: (context, index) {
        final comment = comments[index];
        return _CommentTile(
          comment: comment,
          onLikeTap: () {
            // TODO: Implement comment like via API
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Liked!'), duration: Duration(milliseconds: 500)),
            );
          },
          onReplyTap: () {
            _focusNode.requestFocus();
            _commentController.text = '@${comment.user?.username ?? 'user'} ';
            _commentController.selection = TextSelection.fromPosition(
              TextPosition(offset: _commentController.text.length),
            );
          },
        );
      },
    );
  }

  Widget _buildCommentInput(ThemeData theme, bool isDark) {
    final currentUser = ref.watch(authProvider).user;
    
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : AppColors.lightCard,
          border: Border(
            top: BorderSide(
              color: theme.dividerColor.withValues(alpha: 0.1),
            ),
          ),
        ),
        child: Row(
          children: [
            // Current user avatar - handles both SVG and regular images
            NetworkAvatar(
              imageUrl: currentUser?.profilePicture,
              radius: 18,
              fallbackText: currentUser?.username ?? 'U',
              backgroundColor: AppColors.primary.withValues(alpha: 0.2),
              foregroundColor: AppColors.primary,
            ),
            const SizedBox(width: 12),
            
            // Text field
            Expanded(
              child: TextField(
                controller: _commentController,
                focusNode: _focusNode,
                decoration: InputDecoration(
                  hintText: 'Add a comment...',
                  hintStyle: TextStyle(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: isDark 
                      ? Colors.white.withValues(alpha: 0.1)
                      : Colors.black.withValues(alpha: 0.05),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _submitComment(),
              ),
            ),
            const SizedBox(width: 8),
            
            // Send button
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
    );
  }
}

/// Single comment tile widget
class _CommentTile extends StatelessWidget {
  final CommentModel comment;
  final VoidCallback onLikeTap;
  final VoidCallback onReplyTap;

  const _CommentTile({
    required this.comment,
    required this.onLikeTap,
    required this.onReplyTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = comment.user;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar - handles both SVG and regular images
          NetworkAvatar(
            imageUrl: user?.profilePicture,
            radius: 18,
            fallbackText: user?.name ?? user?.username ?? 'U',
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            foregroundColor: AppColors.primary,
          ),
          const SizedBox(width: 12),
          
          // Comment content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Username and content
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
                
                // Actions row
                Row(
                  children: [
                    Text(
                      timeago.format(comment.createdAt),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                      ),
                    ),
                    const SizedBox(width: 16),
                    if (comment.likesCount > 0)
                      Text(
                        '${comment.likesCount} likes',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    const SizedBox(width: 16),
                    GestureDetector(
                      onTap: onReplyTap,
                      child: Text(
                        'Reply',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                
                // Replies indicator
                if (comment.repliesCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: GestureDetector(
                      onTap: () {
                        // TODO: Show replies
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Replies coming soon!'),
                            duration: Duration(seconds: 1),
                          ),
                        );
                      },
                      child: Text(
                        '── View ${comment.repliesCount} replies',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Like button
          IconButton(
            icon: Icon(
              comment.isLiked ? Icons.favorite : Icons.favorite_border,
              size: 16,
            ),
            color: comment.isLiked ? AppColors.like : theme.colorScheme.onSurface.withValues(alpha: 0.5),
            onPressed: onLikeTap,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}
