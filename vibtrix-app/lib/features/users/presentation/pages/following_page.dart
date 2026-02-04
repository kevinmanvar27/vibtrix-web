import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../auth/data/models/user_model.dart';
import '../providers/users_provider.dart';
import 'profile_page.dart';

/// Page showing list of users that a user is following
/// CONNECTED TO REAL API
class FollowingPage extends ConsumerWidget {
  final String userId;

  const FollowingPage({
    super.key,
    required this.userId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final followingState = ref.watch(followingProvider(userId));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('Following'),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(followingProvider(userId).notifier).loadFollowing(refresh: true),
        child: followingState.isLoading && followingState.users.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : followingState.errorMessage != null && followingState.users.isEmpty
                ? _buildErrorState(followingState.errorMessage!, ref)
                : followingState.users.isEmpty
                    ? _buildEmptyState()
                    : NotificationListener<ScrollNotification>(
                        onNotification: (notification) {
                          // Load more when near the bottom
                          if (notification is ScrollEndNotification &&
                              notification.metrics.extentAfter < 200 &&
                              followingState.hasMore &&
                              !followingState.isLoadingMore) {
                            ref.read(followingProvider(userId).notifier).loadMore();
                          }
                          return false;
                        },
                        child: ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: followingState.users.length + (followingState.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index >= followingState.users.length) {
                              // Loading indicator at the bottom
                              return const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                  child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                                ),
                              );
                            }
                            final user = followingState.users[index];
                            return _FollowingUserTile(
                              user: user,
                              onTap: () => _navigateToProfile(context, user.id),
                            );
                          },
                        ),
                      ),
      ),
    );
  }

  Widget _buildErrorState(String message, WidgetRef ref) {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppColors.error),
              const SizedBox(height: 16),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.read(followingProvider(userId).notifier).loadFollowing(refresh: true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: SingleChildScrollView(
        physics: AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.person_add_outlined, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text(
                'Not following anyone',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
              SizedBox(height: 8),
              Text(
                'Start following people to see their posts',
                style: TextStyle(color: Colors.grey, fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _navigateToProfile(BuildContext context, String userId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfilePage(userId: userId),
      ),
    );
  }
}

/// User tile for following list with real API unfollow option
class _FollowingUserTile extends ConsumerStatefulWidget {
  final SimpleUserModel user;
  final VoidCallback? onTap;

  const _FollowingUserTile({
    required this.user,
    this.onTap,
  });

  @override
  ConsumerState<_FollowingUserTile> createState() => _FollowingUserTileState();
}

class _FollowingUserTileState extends ConsumerState<_FollowingUserTile> {
  late bool _isFollowing;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // In the following list, the user should always be followed initially
    // But we also check the API value in case it's different
    _isFollowing = widget.user.isFollowing ?? true;
  }

  @override
  void didUpdateWidget(covariant _FollowingUserTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update if the user data changes
    if (oldWidget.user.isFollowing != widget.user.isFollowing) {
      _isFollowing = widget.user.isFollowing ?? true;
    }
  }

  Future<void> _toggleFollow() async {
    if (_isLoading) return;
    
    setState(() => _isLoading = true);
    
    final repository = ref.read(usersRepositoryProvider);
    final result = _isFollowing
        ? await repository.unfollowUser(widget.user.id)
        : await repository.followUser(widget.user.id);

    if (mounted) {
      result.fold(
        (failure) {
          // Show error
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(failure.message ?? 'Failed to update follow status'),
              backgroundColor: AppColors.error,
            ),
          );
        },
        (_) {
          // Success - toggle state
          setState(() {
            _isFollowing = !_isFollowing;
          });
        },
      );
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      onTap: widget.onTap,
      leading: NetworkAvatar(
        imageUrl: widget.user.profilePicture,
        radius: 24,
        fallbackText: widget.user.name ?? widget.user.username,
        backgroundColor: AppColors.primary.withValues(alpha: 0.2),
        foregroundColor: AppColors.primary,
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              widget.user.username,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (widget.user.isVerified)
            const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.verified, color: AppColors.primary, size: 16),
            ),
        ],
      ),
      subtitle: widget.user.name != null
          ? Text(
              widget.user.name!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
              overflow: TextOverflow.ellipsis,
            )
          : null,
      trailing: SizedBox(
        width: 100,
        height: 32,
        child: _isLoading
            ? const Center(
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                ),
              )
            : _isFollowing
                ? OutlinedButton(
                    onPressed: _toggleFollow,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Following', style: TextStyle(fontSize: 12)),
                  )
                : ElevatedButton(
                    onPressed: _toggleFollow,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      minimumSize: Size.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Follow', style: TextStyle(fontSize: 12)),
                  ),
      ),
    );
  }
}
