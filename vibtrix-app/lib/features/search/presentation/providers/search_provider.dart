/// Search state management using Riverpod
/// Handles search queries, results, history, and suggestions

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../data/models/search_model.dart';
import '../../data/datasources/search_api_service.dart';
import '../../domain/repositories/search_repository.dart';

// ============================================================================
// Search State
// ============================================================================

class SearchState {
  final String query;
  final SearchType searchType;
  final List<SimpleUserModel> userResults;
  final List<PostModel> postResults;
  final List<HashtagModel> hashtagResults;
  final List<RecentSearchModel> recentSearches;
  final SearchSuggestionsModel? suggestions;
  final TrendingHashtagsModel? trendingHashtags;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;

  const SearchState({
    this.query = '',
    this.searchType = SearchType.all,
    this.userResults = const [],
    this.postResults = const [],
    this.hashtagResults = const [],
    this.recentSearches = const [],
    this.suggestions,
    this.trendingHashtags,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
  });

  bool get hasResults =>
      userResults.isNotEmpty ||
      postResults.isNotEmpty ||
      hashtagResults.isNotEmpty;

  SearchState copyWith({
    String? query,
    SearchType? searchType,
    List<SimpleUserModel>? userResults,
    List<PostModel>? postResults,
    List<HashtagModel>? hashtagResults,
    List<RecentSearchModel>? recentSearches,
    SearchSuggestionsModel? suggestions,
    TrendingHashtagsModel? trendingHashtags,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    bool clearError = false,
    bool clearResults = false,
    bool clearSuggestions = false,
  }) {
    return SearchState(
      query: query ?? this.query,
      searchType: searchType ?? this.searchType,
      userResults: clearResults ? [] : (userResults ?? this.userResults),
      postResults: clearResults ? [] : (postResults ?? this.postResults),
      hashtagResults: clearResults ? [] : (hashtagResults ?? this.hashtagResults),
      recentSearches: recentSearches ?? this.recentSearches,
      suggestions: clearSuggestions ? null : (suggestions ?? this.suggestions),
      trendingHashtags: trendingHashtags ?? this.trendingHashtags,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// Search Notifier
// ============================================================================

class SearchNotifier extends StateNotifier<SearchState> {
  final SearchRepository _repository;

  SearchNotifier(this._repository) : super(const SearchState()) {
    _loadRecentSearches();
    _loadTrendingHashtags();
  }

  /// Load recent searches from server
  Future<void> _loadRecentSearches() async {
    final result = await _repository.getRecentSearches();
    result.fold(
      (failure) {},
      (searches) {
        state = state.copyWith(recentSearches: searches);
      },
    );
  }

  /// Load trending hashtags
  Future<void> _loadTrendingHashtags() async {
    final result = await _repository.getTrendingHashtags();
    result.fold(
      (failure) {},
      (trending) {
        state = state.copyWith(trendingHashtags: trending);
      },
    );
  }

  /// Update query and get suggestions
  Future<void> updateQuery(String query) async {
    state = state.copyWith(query: query);

    if (query.isEmpty) {
      state = state.copyWith(clearSuggestions: true, clearResults: true);
      return;
    }

    if (query.length < 2) return;

    final result = await _repository.getSuggestions(query);
    result.fold(
      (failure) {},
      (suggestions) {
        state = state.copyWith(suggestions: suggestions);
      },
    );
  }

  /// Perform global search
  Future<void> search({SearchType? type}) async {
    if (state.query.isEmpty) return;

    final searchType = type ?? state.searchType;
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearResults: true,
      searchType: searchType,
      hasMore: true,
      cursor: null,
    );

    // Save to recent searches
    _saveRecentSearch(state.query, searchType);

    // Perform the appropriate search based on type
    if (searchType == SearchType.all) {
      await _performGlobalSearch();
    } else {
      await _performTypedSearch(searchType);
    }
  }

  /// Perform global search (all types)
  Future<void> _performGlobalSearch() async {
    final result = await _repository.search(state.query);

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
      },
      (searchResult) {
        state = state.copyWith(
          isLoading: false,
          userResults: searchResult.users,
          postResults: searchResult.posts,
          hashtagResults: searchResult.hashtags,
          hasMore: false, // Global search doesn't have pagination
        );
      },
    );
  }

  /// Perform typed search (specific type)
  Future<void> _performTypedSearch(SearchType type) async {
    switch (type) {
      case SearchType.users:
        final result = await _repository.searchUsers(state.query);
        result.fold(
          (failure) {
            state = state.copyWith(
              isLoading: false,
              errorMessage: _getErrorMessage(failure),
            );
          },
          (response) {
            state = state.copyWith(
              isLoading: false,
              userResults: response.data,
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.posts:
        final result = await _repository.searchPosts(state.query);
        result.fold(
          (failure) {
            state = state.copyWith(
              isLoading: false,
              errorMessage: _getErrorMessage(failure),
            );
          },
          (response) {
            state = state.copyWith(
              isLoading: false,
              postResults: response.data,
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.hashtags:
        final result = await _repository.searchHashtags(state.query);
        result.fold(
          (failure) {
            state = state.copyWith(
              isLoading: false,
              errorMessage: _getErrorMessage(failure),
            );
          },
          (response) {
            state = state.copyWith(
              isLoading: false,
              hashtagResults: response.data,
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.all:
      case SearchType.competitions:
        // Competitions search not available - fall back to global search
        await _performGlobalSearch();
        break;
    }
  }

  /// Load more results
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.cursor == null) return;

    state = state.copyWith(isLoadingMore: true);

    switch (state.searchType) {
      case SearchType.all:
        // Global search doesn't support pagination
        state = state.copyWith(isLoadingMore: false, hasMore: false);
        break;
      case SearchType.users:
        final result = await _repository.searchUsers(state.query, cursor: state.cursor);
        result.fold(
          (failure) {
            state = state.copyWith(isLoadingMore: false);
          },
          (response) {
            state = state.copyWith(
              isLoadingMore: false,
              userResults: [...state.userResults, ...response.data],
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.posts:
        final result = await _repository.searchPosts(state.query, cursor: state.cursor);
        result.fold(
          (failure) {
            state = state.copyWith(isLoadingMore: false);
          },
          (response) {
            state = state.copyWith(
              isLoadingMore: false,
              postResults: [...state.postResults, ...response.data],
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.hashtags:
        final result = await _repository.searchHashtags(state.query, cursor: state.cursor);
        result.fold(
          (failure) {
            state = state.copyWith(isLoadingMore: false);
          },
          (response) {
            state = state.copyWith(
              isLoadingMore: false,
              hashtagResults: [...state.hashtagResults, ...response.data],
              cursor: response.nextCursor,
              hasMore: response.hasMore,
            );
          },
        );
        break;
      case SearchType.competitions:
        // Not supported
        state = state.copyWith(isLoadingMore: false, hasMore: false);
        break;
    }
  }

  /// Search users only
  Future<void> searchUsers() async {
    await search(type: SearchType.users);
  }

  /// Search posts only
  Future<void> searchPosts() async {
    await search(type: SearchType.posts);
  }

  /// Search hashtags only
  Future<void> searchHashtags() async {
    await search(type: SearchType.hashtags);
  }

  /// Save query to recent searches
  Future<void> _saveRecentSearch(String query, SearchType type) async {
    if (query.isEmpty) return;
    final typeStr = type == SearchType.users ? 'user' 
        : type == SearchType.hashtags ? 'hashtag' 
        : 'text';
    await _repository.saveRecentSearch(SaveRecentSearchRequest(
      query: query,
      type: typeStr,
    ));
    // Reload recent searches
    _loadRecentSearches();
  }

  /// Remove item from recent searches
  Future<void> removeFromRecentSearches(String searchId) async {
    await _repository.deleteRecentSearch(searchId);
    // Optimistic update
    final searches = state.recentSearches.where((s) => s.id != searchId).toList();
    state = state.copyWith(recentSearches: searches);
  }

  /// Clear all recent searches
  Future<void> clearRecentSearches() async {
    await _repository.clearRecentSearches();
    state = state.copyWith(recentSearches: []);
  }

  /// Clear search results
  void clearResults() {
    state = state.copyWith(
      query: '',
      clearResults: true,
      clearSuggestions: true,
    );
  }

  /// Refresh trending hashtags
  Future<void> refreshTrending() async {
    await _loadTrendingHashtags();
  }

  String _getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return 'Network error. Please check your connection.';
    } else if (failure is ServerFailure) {
      return failure.message ?? 'Server error. Please try again.';
    }
    return failure.message ?? 'Search failed. Please try again.';
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main search provider
final searchProvider = StateNotifierProvider<SearchNotifier, SearchState>(
  (ref) {
    final repository = ref.watch(searchRepositoryProvider);
    return SearchNotifier(repository);
  },
);

/// Trending hashtags provider
final searchTrendingHashtagsProvider = FutureProvider<List<HashtagModel>>((ref) async {
  final repository = ref.watch(searchRepositoryProvider);
  final result = await repository.getTrendingHashtags();
  return result.fold(
    (failure) => [],
    (trending) => trending.hashtags,
  );
});

/// Recent searches provider
final recentSearchesProvider = FutureProvider<List<RecentSearchModel>>((ref) async {
  final repository = ref.watch(searchRepositoryProvider);
  final result = await repository.getRecentSearches();
  return result.fold(
    (failure) => [],
    (searches) => searches,
  );
});

/// Search suggestions provider (auto-complete)
final searchSuggestionsProvider = FutureProvider.family<SearchSuggestionsModel?, String>((ref, query) async {
  if (query.length < 2) return null;
  final repository = ref.watch(searchRepositoryProvider);
  final result = await repository.getSuggestions(query);
  return result.fold(
    (failure) => null,
    (suggestions) => suggestions,
  );
});

/// Posts by hashtag provider
final postsByHashtagProvider = FutureProvider.family<List<PostModel>, String>((ref, hashtag) async {
  final repository = ref.watch(searchRepositoryProvider);
  final result = await repository.getPostsByHashtag(hashtag);
  return result.fold(
    (failure) => [],
    (response) => response.data,
  );
});
