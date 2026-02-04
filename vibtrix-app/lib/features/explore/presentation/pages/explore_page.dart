import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../search/presentation/pages/search_page.dart';
import '../providers/explore_provider.dart';
import '../../../users/presentation/pages/profile_page.dart';
import '../../../auth/data/models/user_model.dart';

/// Discover/Explore page showing trending content and users
/// CONNECTED TO REAL API
class ExplorePage extends ConsumerStatefulWidget {
  const ExplorePage({super.key});

  @override
  ConsumerState<ExplorePage> createState() => _ExplorePageState();
}

class _ExplorePageState extends ConsumerState<ExplorePage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    // Load explore feed on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(exploreProvider.notifier).loadExploreFeed();
      ref.read(exploreProvider.notifier).loadDiscoverPosts();
      ref.read(exploreProvider.notifier).loadSuggestedUsers();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    await ref.read(exploreProvider.notifier).refresh();
    await ref.read(exploreProvider.notifier).loadDiscoverPosts();
    await ref.read(exploreProvider.notifier).loadSuggestedUsers();
  }

  @override
  Widget build(BuildContext context) {
    final exploreState = ref.watch(exploreProvider);
    
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            floating: true,
            snap: true,
            title: const Text('Explore'),
            actions: [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SearchPage()),
                  );
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              tabs: const [
                Tab(text: 'Trending'),
                Tab(text: 'For You'),
                Tab(text: 'Following'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildTrendingTab(exploreState),
            _buildForYouTab(),
            _buildFollowingTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendingTab(ExploreState exploreState) {
    // Build categories from API or use defaults
    final categories = ['All', ...exploreState.categories.map((c) => c.name).take(8)];
    
    return Column(
      children: [
        // Category chips
        SizedBox(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              final isSelected = category == _selectedCategory;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() => _selectedCategory = category);
                    // Reload posts for selected category
                    ref.read(exploreProvider.notifier).loadDiscoverPosts(
                      category: category == 'All' ? null : category,
                    );
                  },
                ),
              );
            },
          ),
        ),
        // Content grid
        Expanded(
          child: exploreState.isLoading
              ? const Center(child: CircularProgressIndicator())
              : exploreState.error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text(exploreState.error!),
                          const SizedBox(height: 16),
                          FilledButton(
                            onPressed: _refresh,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _refresh,
                      child: _buildPostsGrid(
                        exploreState.discoverPosts.isNotEmpty 
                            ? exploreState.discoverPosts 
                            : exploreState.trendingPosts,
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildForYouTab() {
    final forYouAsync = ref.watch(forYouFeedProvider);
    final exploreState = ref.watch(exploreProvider);
    
    return forYouAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text('Error: $error'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => ref.refresh(forYouFeedProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (posts) => RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(forYouFeedProvider);
          await ref.read(exploreProvider.notifier).refresh();
        },
        child: CustomScrollView(
          slivers: [
            // Featured section
            SliverToBoxAdapter(
              child: _buildFeaturedSection(exploreState.trendingPosts),
            ),
            // Suggested users
            SliverToBoxAdapter(
              child: _buildSuggestedUsers(exploreState.suggestedUsers),
            ),
            // Posts grid
            SliverPadding(
              padding: const EdgeInsets.all(2),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 2,
                  mainAxisSpacing: 2,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildPostTile(posts[index % posts.length]),
                  childCount: posts.length,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowingTab() {
    // Use the following feed provider to get posts from followed users
    final followingAsync = ref.watch(followingFeedProvider);

    return followingAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text('Error: $error'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => ref.refresh(followingFeedProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 80, color: Colors.grey.shade400),
                const SizedBox(height: 16),
                Text(
                  'Follow people to see their posts',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: () {
                    // Navigate to discover users
                    _tabController.animateTo(1);
                  },
                  icon: const Icon(Icons.person_add),
                  label: const Text('Find People'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(followingFeedProvider);
          },
          child: _buildPostsGrid(posts),
        );
      },
    );
  }

  Widget _buildPostsGrid(List<PostModel> posts) {
    if (posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No posts found',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) => _buildPostTile(posts[index]),
    );
  }

  Widget _buildPostTile(PostModel post) {
    // Use URL utility to get full URL for images
    final thumbnailUrl = UrlUtils.getPostThumbnailUrl(
      post.media?.thumbnailUrl,
      post.media?.url,
    );
    final isVideo = post.media?.type == 'video';
    
    return GestureDetector(
      onTap: () {
        // Navigate to post detail
        context.push('/post/${post.id}');
      },
      child: Stack(
        fit: StackFit.expand,
        children: [
          thumbnailUrl.isNotEmpty
              ? CachedNetworkImage(
                  imageUrl: thumbnailUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.grey.shade200,
                    child: const Center(
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.error),
                  ),
                )
              : Container(
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.image_not_supported),
                ),
          // Video indicator
          if (isVideo)
            const Positioned(
              top: 8,
              right: 8,
              child: Icon(
                Icons.play_circle_fill,
                color: Colors.white,
                size: 24,
              ),
            ),
          // Stats overlay on hover/tap
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.6),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
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
  }

  Widget _buildFeaturedSection(List<PostModel> featuredPosts) {
    if (featuredPosts.isEmpty) {
      return const SizedBox.shrink();
    }
    
    final displayPosts = featuredPosts.take(5).toList();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Featured',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: displayPosts.length,
            itemBuilder: (context, index) {
              final post = displayPosts[index];
              // Use URL utility to get full URL for images
              final imageUrl = UrlUtils.getPostThumbnailUrl(
                post.media?.thumbnailUrl,
                post.media?.url,
              );
              
              return Container(
                width: 300,
                margin: const EdgeInsets.only(right: 16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      imageUrl.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: Colors.grey.shade300,
                                child: const Center(child: CircularProgressIndicator()),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.grey.shade300,
                                child: const Icon(Icons.error),
                              ),
                            )
                          : Container(
                              color: Colors.grey.shade300,
                              child: const Icon(Icons.image_not_supported),
                            ),
                      Container(
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
                      ),
                      Positioned(
                        bottom: 12,
                        left: 12,
                        right: 12,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                NetworkAvatar(
                                  imageUrl: post.user?.profilePicture,
                                  fallbackText: post.user?.name ?? 'U',
                                  radius: 16,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    post.user?.name ?? 'Unknown',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              post.caption ?? '',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSuggestedUsers(List suggestedUsers) {
    if (suggestedUsers.isEmpty) {
      return const SizedBox.shrink();
    }
    
    final displayUsers = suggestedUsers.take(5).toList();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Suggested for you',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const SearchPage()),
                  );
                },
                child: const Text('See All'),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: displayUsers.length,
            itemBuilder: (context, index) {
              final user = displayUsers[index];
              return _SuggestedUserCard(user: user);
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
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

/// Suggested user card widget with follow functionality
class _SuggestedUserCard extends ConsumerStatefulWidget {
  final SimpleUserModel user;

  const _SuggestedUserCard({required this.user});

  @override
  ConsumerState<_SuggestedUserCard> createState() => _SuggestedUserCardState();
}

class _SuggestedUserCardState extends ConsumerState<_SuggestedUserCard> {
  bool _isFollowing = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _isFollowing = widget.user.isFollowing ?? false;
  }

  Future<void> _toggleFollow() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final repository = ref.read(usersRepositoryProvider);
      
      if (_isFollowing) {
        final result = await repository.unfollowUser(widget.user.id);
        result.fold(
          (failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to unfollow: ${failure.message}')),
            );
          },
          (_) {
            setState(() => _isFollowing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Unfollowed ${widget.user.name ?? widget.user.username}')),
            );
          },
        );
      } else {
        final result = await repository.followUser(widget.user.id);
        result.fold(
          (failure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to follow: ${failure.message}')),
            );
          },
          (_) {
            setState(() => _isFollowing = true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Following ${widget.user.name ?? widget.user.username}')),
            );
          },
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      child: Card(
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ProfilePage(userId: widget.user.id),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                NetworkAvatar(
                  imageUrl: widget.user.profilePicture,
                  fallbackText: widget.user.name ?? widget.user.username,
                  radius: 32,
                ),
                const SizedBox(height: 8),
                Text(
                  widget.user.name ?? widget.user.username,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '@${widget.user.username}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: _isLoading
                      ? const SizedBox(
                          height: 36,
                          child: Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                        )
                      : _isFollowing
                          ? OutlinedButton(
                              onPressed: _toggleFollow,
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                              ),
                              child: const Text('Following'),
                            )
                          : FilledButton(
                              onPressed: _toggleFollow,
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                              ),
                              child: const Text('Follow'),
                            ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
