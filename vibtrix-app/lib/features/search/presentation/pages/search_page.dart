import 'package:cached_network_image/cached_network_image.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../users/presentation/pages/profile_page.dart';

/// Search page for finding users, posts, and competitions
/// CONNECTED TO REAL API
class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  late TabController _tabController;
  String _query = '';
  List<String> _recentSearches = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _searchController.addListener(() {
      setState(() {
        _query = _searchController.text;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _performSearch(String query) {
    if (query.trim().isEmpty) return;
    
    setState(() {
      // Add to recent searches
      _recentSearches.remove(query);
      _recentSearches.insert(0, query);
      if (_recentSearches.length > 10) {
        _recentSearches = _recentSearches.take(10).toList();
      }
    });

    // Perform search using provider
    ref.read(searchProvider.notifier).search(query);
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _query = '';
    });
    ref.read(searchProvider.notifier).clearSearch();
  }

  @override
  Widget build(BuildContext context) {
    final searchState = ref.watch(searchProvider);
    final exploreState = ref.watch(exploreProvider);
    
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search users, posts, competitions...',
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 8),
            suffixIcon: _query.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear, size: 20),
                    onPressed: _clearSearch,
                  )
                : null,
          ),
          textInputAction: TextInputAction.search,
          onSubmitted: _performSearch,
        ),
        actions: [
          if (_query.isNotEmpty)
            TextButton(
              onPressed: () => _performSearch(_query),
              child: const Text('Search'),
            ),
        ],
        bottom: _query.isNotEmpty
            ? TabBar(
                controller: _tabController,
                isScrollable: true,
                tabs: const [
                  Tab(text: 'All'),
                  Tab(text: 'Users'),
                  Tab(text: 'Posts'),
                  Tab(text: 'Competitions'),
                ],
              )
            : null,
      ),
      body: _query.isEmpty
          ? _buildInitialState(exploreState)
          : searchState.isLoading
              ? const Center(child: CircularProgressIndicator())
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildAllResults(searchState),
                    _buildUserResults(searchState),
                    _buildPostResults(searchState),
                    _buildCompetitionResults(),
                  ],
                ),
    );
  }

  Widget _buildInitialState(ExploreState exploreState) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent searches
          if (_recentSearches.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Searches',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() => _recentSearches.clear());
                    },
                    child: const Text('Clear All'),
                  ),
                ],
              ),
            ),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _recentSearches.length,
              itemBuilder: (context, index) {
                final search = _recentSearches[index];
                return ListTile(
                  leading: const Icon(Icons.history),
                  title: Text(search),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () {
                      setState(() {
                        _recentSearches.removeAt(index);
                      });
                    },
                  ),
                  onTap: () {
                    _searchController.text = search;
                    _performSearch(search);
                  },
                );
              },
            ),
            const Divider(),
          ],
          // Trending hashtags from API
          if (exploreState.trendingHashtags.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text(
                'Trending Hashtags',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: exploreState.trendingHashtags.take(8).length,
              itemBuilder: (context, index) {
                final hashtag = exploreState.trendingHashtags[index];
                return ListTile(
                  leading: Text(
                    '${index + 1}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: index < 3 ? Colors.orange : Colors.grey,
                    ),
                  ),
                  title: Text(hashtag.displayName),
                  subtitle: Text('${_formatCount(hashtag.postCount)} posts'),
                  trailing: hashtag.isTrending
                      ? const Icon(Icons.trending_up, color: Colors.green)
                      : null,
                  onTap: () {
                    _searchController.text = hashtag.name;
                    _performSearch(hashtag.name);
                  },
                );
              },
            ),
          ] else ...[
            // Fallback trending searches when API hasn't loaded
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text(
                'Popular Searches',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ),
            _buildDefaultTrendingSearches(),
          ],
        ],
      ),
    );
  }

  Widget _buildDefaultTrendingSearches() {
    final defaultSearches = [
      'Dance Challenge',
      'Music',
      'Comedy',
      'Fashion',
      'Food',
      'Travel',
      'Gaming',
      'Fitness',
    ];
    
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: defaultSearches.length,
      itemBuilder: (context, index) {
        final search = defaultSearches[index];
        return ListTile(
          leading: Text(
            '${index + 1}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: index < 3 ? Colors.orange : Colors.grey,
            ),
          ),
          title: Text(search),
          trailing: const Icon(Icons.search),
          onTap: () {
            _searchController.text = search;
            _performSearch(search);
          },
        );
      },
    );
  }

  Widget _buildAllResults(SearchState searchState) {
    final users = searchState.users;
    final posts = searchState.posts;

    if (users.isEmpty && posts.isEmpty) {
      return _buildNoResults();
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Users section
          if (users.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Users',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  if (users.length > 3)
                    TextButton(
                      onPressed: () => _tabController.animateTo(1),
                      child: const Text('See All'),
                    ),
                ],
              ),
            ),
            ...users.take(3).map((user) => _buildUserTile(user)),
            const Divider(),
          ],
          // Posts section
          if (posts.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Posts',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  if (posts.length > 6)
                    TextButton(
                      onPressed: () => _tabController.animateTo(2),
                      child: const Text('See All'),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 4,
                  mainAxisSpacing: 4,
                ),
                itemCount: posts.take(6).length,
                itemBuilder: (context, index) => _buildPostTile(posts[index]),
              ),
            ),
            const Divider(),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildUserResults(SearchState searchState) {
    final users = searchState.users;
    
    if (users.isEmpty) {
      return _buildNoResults('No users found');
    }

    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) => _buildUserTile(users[index]),
    );
  }

  Widget _buildPostResults(SearchState searchState) {
    final posts = searchState.posts;
    
    if (posts.isEmpty) {
      return _buildNoResults('No posts found');
    }

    return GridView.builder(
      padding: const EdgeInsets.all(4),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: posts.length,
      itemBuilder: (context, index) => _buildPostTile(posts[index]),
    );
  }

  Widget _buildCompetitionResults() {
    // For competitions, we'll show active competitions from explore state
    final exploreState = ref.watch(exploreProvider);
    final competitions = exploreState.activeCompetitions;
    
    if (competitions.isEmpty) {
      return _buildNoResults('No competitions found');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: competitions.length,
      itemBuilder: (context, index) => _buildCompetitionTile(competitions[index]),
    );
  }

  Widget _buildNoResults([String message = 'No results found']) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try different keywords',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserTile(SimpleUserModel user) {
    final displayName = user.name ?? user.username;
    
    return ListTile(
      leading: NetworkAvatar(
        imageUrl: user.profilePicture,
        fallbackText: displayName,
        radius: 20,
      ),
      title: Text(
        displayName,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Text('@${user.username}'),
      trailing: OutlinedButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Following $displayName')),
          );
        },
        child: const Text('Follow'),
      ),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ProfilePage(userId: user.id)),
        );
      },
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Opening post by ${post.user?.name ?? 'Unknown'}')),
        );
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Stack(
          fit: StackFit.expand,
          children: [
            thumbnailUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: thumbnailUrl,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      color: Colors.grey.shade200,
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
            if (isVideo)
              const Positioned(
                top: 4,
                right: 4,
                child: Icon(Icons.play_circle_fill, color: Colors.white, size: 20),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompetitionTile(CompetitionModel competition) {
    // Use URL utility to get full URL for images
    final thumbnailUrl = UrlUtils.getFullMediaUrl(competition.thumbnailUrl ?? '');
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(context, '/competition-detail', arguments: competition.id);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: thumbnailUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: thumbnailUrl,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          width: 80,
                          height: 80,
                          color: Colors.grey.shade200,
                          child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                        ),
                        errorWidget: (context, url, error) => Container(
                          width: 80,
                          height: 80,
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.emoji_events),
                        ),
                      )
                    : Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.emoji_events),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      competition.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      competition.type.name.toUpperCase(),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.emoji_events, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          '₹${competition.prizePool}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.people, size: 14, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          '${competition.participantsCount}',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.grey.shade400,
              ),
            ],
          ),
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
