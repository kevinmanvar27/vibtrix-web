/// Explore state management using Riverpod
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../search/data/models/search_model.dart';
import '../../data/models/explore_model.dart';
import '../../domain/repositories/explore_repository.dart';

// ==================== STATE CLASSES ====================

class ExploreState {
  final ExploreFeedModel? feed;
  final List<PostModel> discoverPosts;
  final List<PostModel> trendingPosts;
  final List<HashtagModel> trendingHashtags;
  final List<SimpleUserModel> suggestedUsers;
  final List<CompetitionModel> activeCompetitions;
  final List<ExploreCategoryModel> categories;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? nextCursor;
  final bool hasMore;

  const ExploreState({
    this.feed,
    this.discoverPosts = const [],
    this.trendingPosts = const [],
    this.trendingHashtags = const [],
    this.suggestedUsers = const [],
    this.activeCompetitions = const [],
    this.categories = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.nextCursor,
    this.hasMore = true,
  });

  ExploreState copyWith({
    ExploreFeedModel? feed,
    List<PostModel>? discoverPosts,
    List<PostModel>? trendingPosts,
    List<HashtagModel>? trendingHashtags,
    List<SimpleUserModel>? suggestedUsers,
    List<CompetitionModel>? activeCompetitions,
    List<ExploreCategoryModel>? categories,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? nextCursor,
    bool? hasMore,
  }) {
    return ExploreState(
      feed: feed ?? this.feed,
      discoverPosts: discoverPosts ?? this.discoverPosts,
      trendingPosts: trendingPosts ?? this.trendingPosts,
      trendingHashtags: trendingHashtags ?? this.trendingHashtags,
      suggestedUsers: suggestedUsers ?? this.suggestedUsers,
      activeCompetitions: activeCompetitions ?? this.activeCompetitions,
      categories: categories ?? this.categories,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class SearchState {
  final String query;
  final List<PostModel> posts;
  final List<SimpleUserModel> users;
  final List<HashtagModel> hashtags;
  final bool isLoading;
  final String? error;

  const SearchState({
    this.query = '',
    this.posts = const [],
    this.users = const [],
    this.hashtags = const [],
    this.isLoading = false,
    this.error,
  });

  SearchState copyWith({
    String? query,
    List<PostModel>? posts,
    List<SimpleUserModel>? users,
    List<HashtagModel>? hashtags,
    bool? isLoading,
    String? error,
  }) {
    return SearchState(
      query: query ?? this.query,
      posts: posts ?? this.posts,
      users: users ?? this.users,
      hashtags: hashtags ?? this.hashtags,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// ==================== NOTIFIERS ====================

class ExploreNotifier extends StateNotifier<ExploreState> {
  final ExploreRepository _repository;

  ExploreNotifier(this._repository) : super(const ExploreState());

  Future<void> loadExploreFeed() async {
    debugPrint('[ExploreProvider] 📱 Loading explore feed...');
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getExploreFeed();

    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load explore feed: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (feed) {
        debugPrint('[ExploreProvider] ✅ Loaded explore feed');
        debugPrint('[ExploreProvider]   - Trending posts: ${feed.trendingPosts?.length ?? 0}');
        debugPrint('[ExploreProvider]   - Suggested users: ${feed.suggestedUsers?.length ?? 0}');
        debugPrint('[ExploreProvider]   - Categories: ${feed.categories?.length ?? 0}');
        state = state.copyWith(
          isLoading: false,
          feed: feed,
          trendingPosts: feed.trendingPosts ?? [],
          trendingHashtags: feed.trendingHashtags ?? [],
          suggestedUsers: feed.suggestedUsers ?? [],
          activeCompetitions: feed.activeCompetitions ?? [],
          categories: feed.categories ?? [],
        );
      },
    );
  }

  Future<void> loadDiscoverPosts({String? category}) async {
    debugPrint('[ExploreProvider] 📱 Loading discover posts${category != null ? " (category: $category)" : ""}...');
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getDiscoverPosts(category: category);

    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load discover posts: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('[ExploreProvider] ✅ Loaded ${response.data.length} discover posts');
        state = state.copyWith(
          isLoading: false,
          discoverPosts: response.data,
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadMoreDiscoverPosts({String? category}) async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) return;

    debugPrint('[ExploreProvider] 📱 Loading more discover posts...');
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getDiscoverPosts(
      category: category,
      cursor: state.nextCursor,
    );

    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load more: ${failure.message}');
        state = state.copyWith(
          isLoadingMore: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('[ExploreProvider] ✅ Loaded ${response.data.length} more posts');
        state = state.copyWith(
          isLoadingMore: false,
          discoverPosts: [...state.discoverPosts, ...response.data],
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadTrendingPosts() async {
    debugPrint('[ExploreProvider] 📱 Loading trending posts...');
    final result = await _repository.getTrendingPosts();
    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load trending posts: ${failure.message}');
      },
      (posts) {
        debugPrint('[ExploreProvider] ✅ Loaded ${posts.length} trending posts');
        state = state.copyWith(trendingPosts: posts);
      },
    );
  }

  Future<void> loadTrendingHashtags() async {
    debugPrint('[ExploreProvider] 📱 Loading trending hashtags...');
    final result = await _repository.getTrendingHashtags();
    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load trending hashtags: ${failure.message}');
      },
      (hashtags) {
        debugPrint('[ExploreProvider] ✅ Loaded ${hashtags.length} trending hashtags');
        state = state.copyWith(trendingHashtags: hashtags);
      },
    );
  }

  Future<void> loadCategories() async {
    debugPrint('[ExploreProvider] 📱 Loading categories...');
    final result = await _repository.getCategories();
    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load categories: ${failure.message}');
      },
      (categories) {
        debugPrint('[ExploreProvider] ✅ Loaded ${categories.length} categories');
        state = state.copyWith(categories: categories);
      },
    );
  }

  /// Load suggested users (recently joined users)
  Future<void> loadSuggestedUsers({int limit = 10}) async {
    debugPrint('[ExploreProvider] 📱 Loading suggested users...');
    final result = await _repository.getDiscoverUsers(limit: limit);
    result.fold(
      (failure) {
        debugPrint('[ExploreProvider] ❌ Failed to load suggested users: ${failure.message}');
      },
      (users) {
        debugPrint('[ExploreProvider] ✅ Loaded ${users.length} suggested users');
        state = state.copyWith(suggestedUsers: users);
      },
    );
  }

  Future<void> refresh() async {
    debugPrint('[ExploreProvider] 🔄 Refreshing explore...');
    state = const ExploreState();
    await loadExploreFeed();
    await loadSuggestedUsers();
  }
}

class SearchNotifier extends StateNotifier<SearchState> {
  final ExploreRepository _repository;

  SearchNotifier(this._repository) : super(const SearchState());

  Future<void> search(String query) async {
    if (query.isEmpty) {
      state = const SearchState();
      return;
    }

    debugPrint('[SearchProvider] 🔍 Searching for: $query');
    state = state.copyWith(query: query, isLoading: true, error: null);

    // Load users, posts, and hashtags separately to maintain proper types
    final usersResult = await _repository.getDiscoverUsers();
    final postsResult = await _repository.getDiscoverPosts();
    final hashtagsResult = await _repository.getTrendingHashtags();

    usersResult.fold(
      (failure) {
        debugPrint('[SearchProvider] ❌ Failed to search users: ${failure.message}');
        state = state.copyWith(error: failure.message);
      },
      (users) {
        final filteredUsers = users
            .where((u) =>
                u.username.toLowerCase().contains(query.toLowerCase()) ||
                (u.name?.toLowerCase().contains(query.toLowerCase()) ?? false))
            .toList();
        debugPrint('[SearchProvider] ✅ Found ${filteredUsers.length} matching users');
        state = state.copyWith(users: filteredUsers);
      },
    );

    postsResult.fold(
      (failure) {
        debugPrint('[SearchProvider] ❌ Failed to search posts: ${failure.message}');
      },
      (response) {
        final filteredPosts = response.data
            .where((p) =>
                p.caption?.toLowerCase().contains(query.toLowerCase()) ?? false)
            .toList();
        debugPrint('[SearchProvider] ✅ Found ${filteredPosts.length} matching posts');
        state = state.copyWith(posts: filteredPosts);
      },
    );

    hashtagsResult.fold(
      (failure) {
        debugPrint('[SearchProvider] ❌ Failed to search hashtags: ${failure.message}');
      },
      (hashtags) {
        final filteredHashtags = hashtags
            .where((h) => h.name.toLowerCase().contains(query.toLowerCase()))
            .toList();
        debugPrint('[SearchProvider] ✅ Found ${filteredHashtags.length} matching hashtags');
        state = state.copyWith(hashtags: filteredHashtags);
      },
    );

    state = state.copyWith(isLoading: false);
  }

  void clearSearch() {
    debugPrint('[SearchProvider] 🧹 Clearing search');
    state = const SearchState();
  }
}

// ==================== PROVIDERS ====================

final exploreProvider = StateNotifierProvider<ExploreNotifier, ExploreState>((ref) {
  return ExploreNotifier(ref.watch(exploreRepositoryProvider));
});

final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier(ref.watch(exploreRepositoryProvider));
});

final forYouFeedProvider = FutureProvider<List<PostModel>>((ref) async {
  debugPrint('[ForYouFeedProvider] 📱 Loading for you feed...');
  final repository = ref.watch(exploreRepositoryProvider);
  final result = await repository.getForYouFeed();
  return result.fold(
    (failure) {
      debugPrint('[ForYouFeedProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[ForYouFeedProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});

/// Following feed provider for posts from followed users
final followingFeedProvider = FutureProvider<List<PostModel>>((ref) async {
  debugPrint('[FollowingFeedProvider] 📱 Loading following feed...');
  final repository = ref.watch(exploreRepositoryProvider);
  final result = await repository.getFollowingFeed();
  return result.fold(
    (failure) {
      debugPrint('[FollowingFeedProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[FollowingFeedProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});

final trendingCreatorsProvider = FutureProvider<List<SimpleUserModel>>((ref) async {
  debugPrint('[TrendingCreatorsProvider] 📱 Loading trending creators...');
  final repository = ref.watch(exploreRepositoryProvider);
  final result = await repository.getTrendingCreators();
  return result.fold(
    (failure) {
      debugPrint('[TrendingCreatorsProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (creators) {
      debugPrint('[TrendingCreatorsProvider] ✅ Loaded ${creators.length} creators');
      return creators;
    },
  );
});

final hashtagDetailProvider = FutureProvider.family<HashtagDetailModel?, String>((ref, hashtag) async {
  debugPrint('[HashtagDetailProvider] 📱 Loading hashtag detail: $hashtag');
  final repository = ref.watch(exploreRepositoryProvider);
  final result = await repository.getHashtagDetail(hashtag);
  return result.fold(
    (failure) {
      debugPrint('[HashtagDetailProvider] ❌ Failed: ${failure.message}');
      return null;
    },
    (detail) {
      debugPrint('[HashtagDetailProvider] ✅ Loaded hashtag: ${detail.name}');
      return detail;
    },
  );
});

final postsByHashtagProvider = FutureProvider.family<List<PostModel>, String>((ref, hashtag) async {
  debugPrint('[PostsByHashtagProvider] 📱 Loading posts for hashtag: $hashtag');
  final repository = ref.watch(exploreRepositoryProvider);
  final result = await repository.getPostsByHashtag(hashtag);
  return result.fold(
    (failure) {
      debugPrint('[PostsByHashtagProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[PostsByHashtagProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});
