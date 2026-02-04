import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../feed/presentation/providers/feed_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../providers/users_provider.dart' hide userPostsProvider;
import 'edit_profile_page.dart';
import 'followers_page.dart';
import 'following_page.dart';

/// User profile page showing user info and their posts
/// CONNECTED TO REAL API
class ProfilePage extends ConsumerStatefulWidget {
  final String? userId;
  
  const ProfilePage({
    super.key,
    this.userId,
  });

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  /// Check if viewing own profile
  bool get isOwnProfile {
    final currentUser = ref.read(currentUserProvider);
    return widget.userId == null || widget.userId == currentUser?.id;
  }
  
  /// Get effective user ID (current user if not specified)
  String get effectiveUserId {
    final currentUser = ref.read(currentUserProvider);
    return widget.userId ?? currentUser?.id ?? '';
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Refresh all profile data
  Future<void> _refreshProfile() async {
    // Refresh user profile data
    await ref.read(userProfileProvider(effectiveUserId).notifier).loadUser();
    // Invalidate and refresh user posts
    ref.invalidate(userPostsProvider(effectiveUserId));
    // Refresh saved posts if viewing own profile
    if (isOwnProfile) {
      ref.invalidate(savedPostsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    // Check if we have a valid user ID
    if (effectiveUserId.isEmpty) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        appBar: AppBar(
          backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          title: const Text('Profile'),
        ),
        body: _buildNotLoggedInState(theme),
      );
    }
    
    final profileState = ref.watch(userProfileProvider(effectiveUserId));
    final user = profileState.user;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: profileState.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : profileState.errorMessage != null
              ? _buildErrorState(profileState.errorMessage!, theme)
              : user == null
                  ? _buildUserNotFoundState(theme)
                  : (user.isBlocked == true && !isOwnProfile)
                      ? _buildBlockedUserState(user, theme, isDark)
                      : RefreshIndicator(
                          onRefresh: () => _refreshProfile(),
                          child: NestedScrollView(
                            headerSliverBuilder: (context, innerBoxIsScrolled) => [
                              _buildSliverAppBar(user, theme, isDark),
                              SliverToBoxAdapter(
                                child: _buildProfileHeader(user, theme, isDark),
                              ),
                              SliverPersistentHeader(
                                pinned: true,
                                delegate: _SliverTabBarDelegate(
                                  TabBar(
                                    controller: _tabController,
                                    indicatorColor: AppColors.primary,
                                    labelColor: theme.colorScheme.onSurface,
                                    unselectedLabelColor: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                                    tabs: const [
                                      Tab(icon: Icon(Icons.grid_on)),
                                      Tab(icon: Icon(Icons.favorite_border)),
                                      Tab(icon: Icon(Icons.bookmark_border)),
                                    ],
                                  ),
                                  isDark ? AppColors.darkBackground : AppColors.lightBackground,
                                ),
                              ),
                            ],
                            body: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildPostsGrid(effectiveUserId),
                                _buildLikedPostsGrid(),
                                _buildSavedPostsGrid(),
                              ],
                            ),
                          ),
                        ),
    );
  }

  Widget _buildNotLoggedInState(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.account_circle_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 24),
            Text(
              'Please login to view your profile',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/login'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Login'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUserNotFoundState(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_off_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 24),
            Text(
              'User not found',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'This user may have been deleted or doesn\'t exist.',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.pop(),
              child: const Text('Go Back'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBlockedUserState(UserProfileModel user, ThemeData theme, bool isDark) {
    return CustomScrollView(
      slivers: [
        _buildSliverAppBar(user, theme, isDark),
        SliverFillRemaining(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  NetworkAvatar(
                    imageUrl: user.profilePicture,
                    radius: 50,
                    fallbackText: user.name ?? user.username,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                    foregroundColor: AppColors.primary,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '@${user.username}',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Icon(Icons.block, size: 48, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'You have blocked this user',
                    style: theme.textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Unblock them to see their profile and posts.',
                    style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => _showUnblockConfirmation(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Unblock'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSliverAppBar(UserProfileModel user, ThemeData theme, bool isDark) {
    return SliverAppBar(
      floating: true,
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      elevation: 0,
      title: Row(
        children: [
          Text(
            user.username,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (user.isVerified)
            const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.verified, color: AppColors.primary, size: 20),
            ),
        ],
      ),
      actions: isOwnProfile
          ? [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => _refreshProfile(),
                tooltip: 'Refresh',
              ),
              IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () => _showSettingsMenu(context),
              ),
            ]
          : [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => _refreshProfile(),
                tooltip: 'Refresh',
              ),
              IconButton(
                icon: const Icon(Icons.more_vert),
                onPressed: () => _showProfileOptions(context),
              ),
            ],
    );
  }

  Widget _buildProfileHeader(UserProfileModel user, ThemeData theme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar and stats row
          Row(
            children: [
              // Profile picture - handles both SVG and regular images
              NetworkAvatar(
                imageUrl: user.profilePicture,
                radius: 42,
                fallbackText: user.name ?? user.username,
                backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                foregroundColor: AppColors.primary,
              ),
              const SizedBox(width: 24),
              
              // Stats
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatColumn('Posts', user.postsCount, theme),
                    GestureDetector(
                      onTap: () => _navigateToFollowers(),
                      child: _buildStatColumn('Followers', user.followersCount, theme),
                    ),
                    GestureDetector(
                      onTap: () => _navigateToFollowing(),
                      child: _buildStatColumn('Following', user.followingCount, theme),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Name
          Text(
            user.name ?? user.username,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          
          // Bio
          if (user.bio != null && user.bio!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              user.bio!,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Action buttons
          _buildActionButtons(user, theme, isDark),
        ],
      ),
    );
  }

  Widget _buildStatColumn(String label, int count, ThemeData theme) {
    return Column(
      children: [
        Text(
          _formatCount(count),
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(UserProfileModel user, ThemeData theme, bool isDark) {
    if (isOwnProfile) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton(
          onPressed: () => _navigateToEditProfile(),
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurface,
            side: BorderSide(color: theme.dividerColor),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text('Edit Profile'),
        ),
      );
    }

    final isFollowing = user.isFollowing ?? false;
    final isFollowLoading = ref.watch(userProfileProvider(effectiveUserId)).isFollowLoading;

    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: isFollowLoading
                ? null
                : () => ref.read(userProfileProvider(effectiveUserId).notifier).toggleFollow(),
            style: ElevatedButton.styleFrom(
              backgroundColor: isFollowing ? Colors.grey[300] : AppColors.primary,
              foregroundColor: isFollowing ? Colors.black : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: isFollowLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isFollowing ? 'Following' : 'Follow'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: () {
              // Navigate to chat with this user
              context.push('/chat/new', extra: {'userId': effectiveUserId});
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: theme.colorScheme.onSurface,
              side: BorderSide(color: theme.dividerColor),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Message'),
          ),
        ),
        const SizedBox(width: 8),
        OutlinedButton(
          onPressed: () {
            // TODO: Suggest similar profiles
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurface,
            side: BorderSide(color: theme.dividerColor),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12),
          ),
          child: const Icon(Icons.person_add_outlined, size: 20),
        ),
      ],
    );
  }

  Widget _buildPostsGrid(String userId) {
    final postsAsync = ref.watch(userPostsProvider(userId));

    return postsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (error, _) => _buildEmptyPostsState('Failed to load posts', Icons.error_outline),
      data: (posts) {
        if (posts.isEmpty) {
          return _buildEmptyPostsState(
            isOwnProfile ? 'No posts yet\nShare your first post!' : 'No posts yet',
            Icons.grid_on,
          );
        }
        return _buildPostsGridView(posts);
      },
    );
  }

  Widget _buildLikedPostsGrid() {
    // For own profile, show liked posts from feed (posts that are liked)
    if (!isOwnProfile) {
      return _buildEmptyPostsState('Liked posts are private', Icons.favorite_border);
    }
    
    // Use feed posts and filter by liked
    final feedState = ref.watch(feedProvider);
    final likedPosts = feedState.posts.where((p) => p.isLiked).toList();
    
    if (feedState.isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    
    if (likedPosts.isEmpty) {
      return _buildEmptyPostsState('No liked posts yet\nLike posts to see them here', Icons.favorite_border);
    }
    return _buildPostsGridView(likedPosts);
  }

  Widget _buildSavedPostsGrid() {
    // For own profile, show saved posts
    if (!isOwnProfile) {
      return _buildEmptyPostsState('Saved posts are private', Icons.bookmark_border);
    }
    
    // Use savedPostsProvider from feed_provider
    final savedPostsAsync = ref.watch(savedPostsProvider);
    
    return savedPostsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      error: (error, _) => _buildEmptyPostsState('Failed to load saved posts', Icons.error_outline),
      data: (posts) {
        if (posts.isEmpty) {
          return _buildEmptyPostsState('No saved posts yet\nSave posts to see them here', Icons.bookmark_border);
        }
        return _buildPostsGridView(posts);
      },
    );
  }

  Widget _buildPostsGridView(List<PostModel> posts) {
    return GridView.builder(
      padding: const EdgeInsets.all(1),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 1,
        mainAxisSpacing: 1,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];
        // Use URL utility to get full URL for images
        final thumbnailUrl = UrlUtils.getPostThumbnailUrl(
          post.media?.thumbnailUrl,
          post.media?.url,
        );
        
        return GestureDetector(
          onTap: () {
            context.push('/post/${post.id}');
          },
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Show thumbnail or placeholder
              thumbnailUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: thumbnailUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.darkMuted,
                        child: const Center(
                          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.darkMuted,
                        child: const Icon(Icons.image_not_supported, color: Colors.grey),
                      ),
                    )
                  : Container(
                      color: AppColors.darkMuted,
                      child: Center(
                        child: Text(
                          post.caption?.substring(0, post.caption!.length > 20 ? 20 : post.caption!.length) ?? '',
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
              // Video indicator
              if (post.media?.isVideo ?? false)
                const Positioned(
                  top: 8,
                  right: 8,
                  child: Icon(Icons.play_arrow, color: Colors.white, size: 24),
                ),
              // Likes count overlay
              Positioned(
                bottom: 4,
                left: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.favorite, color: Colors.white, size: 12),
                      const SizedBox(width: 2),
                      Text(
                        _formatCount(post.likesCount),
                        style: const TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyPostsState(String message, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              message,
              style: const TextStyle(color: Colors.grey, fontSize: 16),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message, ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(
              'Oops! Something went wrong',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            if (effectiveUserId.isNotEmpty)
              ElevatedButton.icon(
                onPressed: () => ref.read(userProfileProvider(effectiveUserId).notifier).loadUser(),
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
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

  void _navigateToFollowers() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FollowersPage(userId: effectiveUserId),
      ),
    );
  }

  void _navigateToFollowing() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FollowingPage(userId: effectiveUserId),
      ),
    );
  }

  void _navigateToEditProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const EditProfilePage(),
      ),
    );
  }

  void _showSettingsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: const Text('Settings'),
              onTap: () {
                Navigator.pop(context);
                context.push('/settings');
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Activity'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Activity coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.qr_code),
              title: const Text('QR Code'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('QR Code coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.bookmark_border),
              title: const Text('Saved'),
              onTap: () {
                Navigator.pop(context);
                _tabController.animateTo(2);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showProfileOptions(BuildContext context) {
    final profileState = ref.read(userProfileProvider(effectiveUserId));
    final user = profileState.user;
    final isBlocked = user?.isBlocked ?? false;

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.share_outlined),
              title: const Text('Share Profile'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Share coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Copy Profile URL'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('URL copied!')),
                );
              },
            ),
            // Show Block or Unblock based on current state
            if (isBlocked)
              ListTile(
                leading: const Icon(Icons.block_flipped),
                title: const Text('Unblock'),
                onTap: () {
                  Navigator.pop(context);
                  _showUnblockConfirmation(context);
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.block, color: AppColors.error),
                title: const Text('Block', style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(context);
                  _showBlockConfirmation(context);
                },
              ),
            ListTile(
              leading: const Icon(Icons.report_outlined, color: AppColors.error),
              title: const Text('Report', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
                _showReportDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showBlockConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Block User?'),
        content: const Text('They won\'t be able to see your profile or posts. You can unblock them anytime.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref.read(userProfileProvider(effectiveUserId).notifier).blockUser();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'User blocked' : 'Failed to block user'),
                    backgroundColor: success ? null : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Block', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _showUnblockConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Unblock User?'),
        content: const Text('They will be able to see your profile and posts again.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref.read(userProfileProvider(effectiveUserId).notifier).unblockUser();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'User unblocked' : 'Failed to unblock user'),
                    backgroundColor: success ? null : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Unblock', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(BuildContext context) {
    String? selectedReason;
    final descriptionController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Report User'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Why are you reporting this user?'),
                const SizedBox(height: 16),
                ...['spam', 'harassment', 'inappropriate_content', 'fake_account', 'other'].map(
                  (reason) => RadioListTile<String>(
                    title: Text(_getReasonLabel(reason)),
                    value: reason,
                    groupValue: selectedReason,
                    onChanged: (value) => setState(() => selectedReason = value),
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Additional details (optional)',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: selectedReason == null
                  ? null
                  : () async {
                      Navigator.pop(context);
                      // Show loading
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Submitting report...')),
                      );
                      // Call API
                      final repository = ref.read(usersRepositoryProvider);
                      final result = await repository.reportUser(
                        effectiveUserId,
                        selectedReason!,
                        descriptionController.text.isNotEmpty ? descriptionController.text : null,
                      );
                      if (mounted) {
                        result.fold(
                          (failure) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(failure.message ?? 'Failed to submit report'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          },
                          (_) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Report submitted. Thank you for helping keep our community safe.'),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          },
                        );
                      }
                    },
              child: Text(
                'Submit',
                style: TextStyle(
                  color: selectedReason != null ? AppColors.error : Colors.grey,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getReasonLabel(String reason) {
    switch (reason) {
      case 'spam':
        return 'Spam';
      case 'harassment':
        return 'Harassment or bullying';
      case 'inappropriate_content':
        return 'Inappropriate content';
      case 'fake_account':
        return 'Fake account';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
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

/// Delegate for pinned tab bar
class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;

  _SliverTabBarDelegate(this.tabBar, this.backgroundColor);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return tabBar != oldDelegate.tabBar || backgroundColor != oldDelegate.backgroundColor;
  }
}
