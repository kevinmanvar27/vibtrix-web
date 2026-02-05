import 'dart:async';
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/utils/url_utils.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../explore/presentation/providers/explore_provider.dart';
import '../../../users/presentation/pages/profile_page.dart';

/// Search page for finding users, posts, and competitions
/// CONNECTED TO REAL API - Instagram-style real-time search
class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> with SingleTickerProviderStateMixin {
  static const _recentSearchesKey = 'recent_searches';
  
  final _searchController = TextEditingController();
  late TabController _tabController;
  String _query = '';
  List<String> _recentSearches = [];
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _searchController.addListener(_onSearchChanged);
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  /// Load recent searches from SharedPreferences
  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    final searches = prefs.getStringList(_recentSearchesKey) ?? [];
    if (mounted) {
      setState(() {
        _recentSearches = searches;
      });
    }
  }

  /// Save recent searches to SharedPreferences
  Future<void> _saveRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_recentSearchesKey, _recentSearches);
  }

  /// Called when search text changes - implements debounced real-time search
  void _onSearchChanged() {
    final query = _searchController.text;
    
    setState(() {
      _query = query;
    });

    // Cancel previous timer
    _debounceTimer?.cancel();

    // If query is empty, clear search results
    if (query.trim().isEmpty) {
      ref.read(searchProvider.notifier).clearSearch();
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _performSearch(query);
    });
  }

  void _performSearch(String query) {
    if (query.trim().isEmpty) return;
    
    // Don't add to recent searches here - only add when user explicitly submits
    // or taps on a search result

    // Perform search using provider
    ref.read(searchProvider.notifier).search(query);
  }

  void _addToRecentSearches(String query) {
    setState(() {
      _recentSearches.remove(query);
      _recentSearches.insert(0, query);
      if (_recentSearches.length > 10) {
        _recentSearches = _recentSearches.take(10).toList();
      }
    });
    // Persist to storage
    _saveRecentSearches();
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
    final hasResults = searchState.users.isNotEmpty || searchState.posts.isNotEmpty;
    
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
          onSubmitted: (query) {
            if (query.isNotEmpty) {
              _addToRecentSearches(query);
            }
          },
        ),
        bottom: _query.isNotEmpty && hasResults
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
              : !hasResults
                  ? _buildNoResults()
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
        _addToRecentSearches(user.username);
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
    final isTextOnly = post.media == null || post.media!.url.isEmpty;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () {
        context.push('/post/${post.id}');
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Text-only posts show text preview
            if (isTextOnly)
              Container(
                color: isDark ? Colors.grey.shade800 : Colors.grey.shade100,
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.text_fields,
                      color: theme.colorScheme.primary,
                      size: 16,
                    ),
                    const SizedBox(height: 4),
                    Expanded(
                      child: Text(
                        post.caption ?? '',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          height: 1.2,
                        ),
                        maxLines: 5,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              )
            else if (thumbnailUrl.isNotEmpty)
              CachedNetworkImage(
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
            else
              Container(
                color: Colors.grey.shade200,
                child: const Icon(Icons.image_not_supported),
              ),
            if (isVideo && !isTextOnly)
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
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.orange.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.emoji_events, color: Colors.orange),
        ),
        title: Text(
          competition.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${competition.participantsCount} participants • ${competition.status.name}',
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opening ${competition.name}')),
          );
        },
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
