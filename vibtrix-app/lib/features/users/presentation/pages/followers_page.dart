import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../auth/data/models/user_model.dart';
import '../providers/users_provider.dart';
import 'profile_page.dart';

/// Page showing list of followers for a user
/// CONNECTED TO REAL API
class FollowersPage extends ConsumerWidget {
  final String userId;

  const FollowersPage({
    super.key,
    required this.userId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final followersState = ref.watch(followersProvider(userId));

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('Followers'),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(followersProvider(userId).notifier).loadFollowers(refresh: true),
        child: followersState.isLoading && followersState.users.isEmpty
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : followersState.errorMessage != null && followersState.users.isEmpty
                ? _buildErrorState(followersState.errorMessage!, ref)
                : followersState.users.isEmpty
                    ? _buildEmptyState()
                    : NotificationListener<ScrollNotification>(
                        onNotification: (notification) {
                          // Load more when near the bottom
                          if (notification is ScrollEndNotification &&
                              notification.metrics.extentAfter < 200 &&
                              followersState.hasMore &&
                              !followersState.isLoadingMore) {
                            ref.read(followersProvider(userId).notifier).loadMore();
                          }
                          return false;
                        },
                        child: ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: followersState.users.length + (followersState.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index >= followersState.users.length) {
                              // Loading indicator at the bottom
                              return const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                  child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                                ),
                              );
                            }
                            final user = followersState.users[index];
                            return _UserListTile(
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
                onPressed: () => ref.read(followersProvider(userId).notifier).loadFollowers(refresh: true),
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
              Icon(Icons.people_outline, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text(
                'No followers yet',
                style: TextStyle(color: Colors.grey, fontSize: 16),
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

/// Reusable user list tile widget with real API follow/unfollow
class _UserListTile extends ConsumerStatefulWidget {
  final SimpleUserModel user;
  final VoidCallback? onTap;

  const _UserListTile({
    required this.user,
    this.onTap,
  });

  @override
  ConsumerState<_UserListTile> createState() => _UserListTileState();
}

class _UserListTileState extends ConsumerState<_UserListTile> {
  late bool _isFollowing;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Use the actual isFollowing value from the API
    _isFollowing = widget.user.isFollowing ?? false;
  }

  @override
  void didUpdateWidget(covariant _UserListTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update if the user data changes
    if (oldWidget.user.isFollowing != widget.user.isFollowing) {
      _isFollowing = widget.user.isFollowing ?? false;
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
    final currentUser = ref.read(currentUserProvider);
    final isOwnProfile = widget.user.id == currentUser?.id;

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
      trailing: isOwnProfile
          ? null
          : SizedBox(
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
