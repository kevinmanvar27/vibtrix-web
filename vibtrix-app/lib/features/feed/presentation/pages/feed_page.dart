import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../posts/data/models/post_model.dart';
import '../providers/feed_provider.dart';
import '../widgets/post_card.dart';

/// Main feed page showing posts from followed users and "For You" recommendations
class FeedPage extends ConsumerStatefulWidget {
  const FeedPage({super.key});

  @override
  ConsumerState<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends ConsumerState<FeedPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _scrollController.addListener(_onScroll);
    
    // Sync tab controller with provider state after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncTabWithProvider();
    });
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  /// Sync tab controller index with provider state
  void _syncTabWithProvider() {
    final feedType = ref.read(feedProvider).feedType;
    final expectedIndex = feedType == FeedType.forYou ? 0 : 1;
    if (_tabController.index != expectedIndex) {
      _tabController.animateTo(expectedIndex);
    }
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      final feedType = _tabController.index == 0 ? FeedType.forYou : FeedType.following;
      ref.read(feedProvider.notifier).switchFeedType(feedType);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(feedProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
            elevation: 0,
            title: Text(
              'VidiBattle',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 24,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  context.push(RouteNames.notifications);
                },
              ),
              IconButton(
                icon: const Icon(Icons.send_outlined),
                onPressed: () {
                  context.push(RouteNames.chat);
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              labelColor: theme.colorScheme.onSurface,
              unselectedLabelColor: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              tabs: const [
                Tab(text: 'For You'),
                Tab(text: 'Following'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildFeedContent(FeedType.forYou),
            _buildFeedContent(FeedType.following),
          ],
        ),
      ),
    );
  }

  Widget _buildFeedContent(FeedType feedType) {
    final feedState = ref.watch(feedProvider);

    // Show loading indicator for initial load
    if (feedState.isLoading && feedState.posts.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16),
            Text('Loading posts...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    // Show error state
    if (feedState.errorMessage != null && feedState.posts.isEmpty) {
      return _buildErrorState(feedState.errorMessage!);
    }

    // Show empty state
    if (feedState.posts.isEmpty) {
      return _buildEmptyState(feedType);
    }

    // Show posts
    return RefreshIndicator(
      onRefresh: () => ref.read(feedProvider.notifier).refresh(),
      color: AppColors.primary,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.zero,
        itemCount: feedState.posts.length + (feedState.isLoadingMore ? 1 : 0) + (!feedState.hasMore && feedState.posts.isNotEmpty ? 1 : 0),
        itemBuilder: (context, index) {
          // Show loading indicator at the bottom
          if (index == feedState.posts.length && feedState.isLoadingMore) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(
                child: CircularProgressIndicator(
                  color: AppColors.primary,
                ),
              ),
            );
          }

          // Show "No more posts" message
          if (index == feedState.posts.length && !feedState.hasMore) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.grey, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'You\'re all caught up!',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                  ],
                ),
              ),
            );
          }

          if (index >= feedState.posts.length) return const SizedBox.shrink();

          final post = feedState.posts[index];
          return PostCard(
            post: post,
            onTap: () => _navigateToPostDetail(post),
            onUserTap: () => _navigateToUserProfile(post.userId),
            onCommentTap: () => _navigateToComments(post.id),
            onShareTap: () => _sharePost(post.id),
          );
        },
      ),
    );
  }

  Widget _buildErrorState(String message) {
    return RefreshIndicator(
      onRefresh: () => ref.read(feedProvider.notifier).refresh(),
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.6,
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.wifi_off_rounded,
                  size: 64,
                  color: Colors.grey,
                ),
                const SizedBox(height: 16),
                Text(
                  'Oops! Something went wrong',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => ref.read(feedProvider.notifier).refresh(),
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
        ),
      ),
    );
  }

  Widget _buildEmptyState(FeedType feedType) {
    final isForYou = feedType == FeedType.forYou;
    
    return RefreshIndicator(
      onRefresh: () => ref.read(feedProvider.notifier).refresh(),
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.6,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    isForYou ? Icons.video_library_outlined : Icons.people_outline,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    isForYou ? 'No posts yet' : 'No posts from people you follow',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isForYou
                        ? 'Be the first to share something amazing!\nPull down to refresh.'
                        : 'Follow some creators to see their posts here.\nPull down to refresh.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  if (!isForYou)
                    ElevatedButton.icon(
                      onPressed: () {
                        context.push(RouteNames.explore);
                      },
                      icon: const Icon(Icons.search),
                      label: const Text('Discover Creators'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _navigateToPostDetail(PostModel post) {
    // Only open full-screen reels for video posts
    if (post.media?.isVideo ?? false) {
      context.push(RouteNames.reelsPath(post.id));
    }
    // For image/text posts, don't navigate to full screen
    // The post is already visible in the feed
  }

  void _navigateToUserProfile(String userId) {
    context.push(RouteNames.userProfilePath(userId));
  }

  void _navigateToComments(String postId) {
    context.push(RouteNames.postCommentsPath(postId));
  }

  void _sharePost(String postId) {
    ref.read(feedProvider.notifier).sharePost(postId);
    // Share the post link
    Share.share('Check out this post on VidiBattle: https://vidibattle.com/post/$postId');
  }
}
