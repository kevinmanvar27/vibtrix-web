/// Feed state management using Riverpod
/// Handles feed loading, pagination, and post interactions
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/domain/repositories/posts_repository.dart';

// ============================================================================
// Feed State
// ============================================================================

/// Represents the current feed state
class FeedState {
  final List<PostModel> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;
  final FeedType feedType;

  const FeedState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
    this.feedType = FeedType.forYou,
  });

  FeedState copyWith({
    List<PostModel>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    FeedType? feedType,
    bool clearError = false,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      feedType: feedType ?? this.feedType,
    );
  }

  factory FeedState.initial() => const FeedState();
}

enum FeedType { forYou, following }

// ============================================================================
// Feed Notifier - Connected to Real API
// ============================================================================

class FeedNotifier extends StateNotifier<FeedState> {
  final PostsRepository _repository;

  FeedNotifier(this._repository) : super(FeedState.initial()) {
    loadFeed();
  }

  /// Load initial feed from real API
  Future<void> loadFeed({FeedType? feedType}) async {
    final type = feedType ?? state.feedType;
    debugPrint('[FeedProvider] 📱 Loading ${type.name} feed...');
    
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      feedType: type,
      posts: [],
      cursor: null,
      hasMore: true,
    );

    try {
      final result = type == FeedType.forYou
          ? await _repository.getFeed(limit: 20)
          : await _repository.getFollowingFeed(limit: 20);

      result.fold(
        (failure) {
          debugPrint('[FeedProvider] ❌ Failed to load feed: ${_getErrorMessage(failure)}');
          state = state.copyWith(
            isLoading: false,
            errorMessage: _getErrorMessage(failure),
          );
        },
        (response) {
          debugPrint('[FeedProvider] ✅ Loaded ${response.data.length} posts');
          state = state.copyWith(
            isLoading: false,
            posts: response.data,
            cursor: response.nextCursor,
            hasMore: response.hasMore,
          );
        },
      );
    } catch (e) {
      debugPrint('[FeedProvider] ❌ Exception: $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load feed: $e',
      );
    }
  }

  /// Load more posts (pagination) from real API
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    debugPrint('[FeedProvider] 📱 Loading more posts...');
    state = state.copyWith(isLoadingMore: true);

    try {
      final result = state.feedType == FeedType.forYou
          ? await _repository.getFeed(cursor: state.cursor, limit: 20)
          : await _repository.getFollowingFeed(cursor: state.cursor, limit: 20);

      result.fold(
        (failure) {
          debugPrint('[FeedProvider] ❌ Failed to load more: ${_getErrorMessage(failure)}');
          state = state.copyWith(
            isLoadingMore: false,
            errorMessage: _getErrorMessage(failure),
          );
        },
        (response) {
          debugPrint('[FeedProvider] ✅ Loaded ${response.data.length} more posts');
          state = state.copyWith(
            isLoadingMore: false,
            posts: [...state.posts, ...response.data],
            cursor: response.nextCursor,
            hasMore: response.hasMore,
          );
        },
      );
    } catch (e) {
      debugPrint('[FeedProvider] ❌ Exception: $e');
      state = state.copyWith(
        isLoadingMore: false,
        errorMessage: 'Failed to load more posts: $e',
      );
    }
  }

  /// Refresh feed
  Future<void> refresh() async {
    debugPrint('[FeedProvider] 🔄 Refreshing feed...');
    await loadFeed(feedType: state.feedType);
  }

  /// Switch feed type
  Future<void> switchFeedType(FeedType type) async {
    if (type == state.feedType) return;
    debugPrint('[FeedProvider] 🔀 Switching to ${type.name} feed');
    await loadFeed(feedType: type);
  }

  /// Like a post (optimistic update with API call)
  Future<void> likePost(String postId) async {
    debugPrint('[FeedProvider] ❤️ Liking post: $postId');
    _updatePostInList(postId, (post) => post.copyWith(
      isLiked: true,
      likesCount: post.likesCount + 1,
    ));

    final result = await _repository.likePost(postId);
    
    result.fold(
      (failure) {
        debugPrint('[FeedProvider] ❌ Like failed, reverting');
        _updatePostInList(postId, (post) => post.copyWith(
          isLiked: false,
          likesCount: post.likesCount - 1,
        ));
      },
      (_) {
        debugPrint('[FeedProvider] ✅ Like successful');
      },
    );
  }

  /// Unlike a post (optimistic update with API call)
  Future<void> unlikePost(String postId) async {
    debugPrint('[FeedProvider] 💔 Unliking post: $postId');
    _updatePostInList(postId, (post) => post.copyWith(
      isLiked: false,
      likesCount: post.likesCount - 1,
    ));

    final result = await _repository.unlikePost(postId);
    
    result.fold(
      (failure) {
        debugPrint('[FeedProvider] ❌ Unlike failed, reverting');
        _updatePostInList(postId, (post) => post.copyWith(
          isLiked: true,
          likesCount: post.likesCount + 1,
        ));
      },
      (_) {
        debugPrint('[FeedProvider] ✅ Unlike successful');
      },
    );
  }

  /// Toggle like state
  void toggleLike(String postId) {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;
    
    final post = state.posts[postIndex];
    if (post.isLiked) {
      unlikePost(postId);
    } else {
      likePost(postId);
    }
  }

  /// Save a post (optimistic update with API call)
  Future<void> savePost(String postId) async {
    debugPrint('[FeedProvider] 🔖 Saving post: $postId');
    _updatePostInList(postId, (post) => post.copyWith(isBookmarked: true));
    
    final result = await _repository.savePost(postId);
    result.fold(
      (failure) {
        debugPrint('[FeedProvider] ❌ Save failed, reverting');
        _updatePostInList(postId, (post) => post.copyWith(isBookmarked: false));
      },
      (_) {
        debugPrint('[FeedProvider] ✅ Save successful');
      },
    );
  }

  /// Unsave a post (optimistic update with API call)
  Future<void> unsavePost(String postId) async {
    debugPrint('[FeedProvider] 🔖 Unsaving post: $postId');
    _updatePostInList(postId, (post) => post.copyWith(isBookmarked: false));
    
    final result = await _repository.unsavePost(postId);
    result.fold(
      (failure) {
        debugPrint('[FeedProvider] ❌ Unsave failed, reverting');
        _updatePostInList(postId, (post) => post.copyWith(isBookmarked: true));
      },
      (_) {
        debugPrint('[FeedProvider] ✅ Unsave successful');
      },
    );
  }

  /// Toggle bookmark state
  void toggleBookmark(String postId) {
    final postIndex = state.posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;
    
    final post = state.posts[postIndex];
    if (post.isBookmarked) {
      unsavePost(postId);
    } else {
      savePost(postId);
    }
  }

  /// Share a post
  Future<void> sharePost(String postId) async {
    debugPrint('[FeedProvider] 📤 Sharing post: $postId');
    _updatePostInList(postId, (post) => post.copyWith(
      sharesCount: post.sharesCount + 1,
    ));
    
    await _repository.sharePost(postId);
  }

  /// Remove post from feed (after delete or hide)
  void removePost(String postId) {
    state = state.copyWith(
      posts: state.posts.where((p) => p.id != postId).toList(),
    );
  }

  /// Add a new post to the top of the feed
  void addPost(PostModel post) {
    state = state.copyWith(posts: [post, ...state.posts]);
  }

  /// Update a post in the list
  void updatePost(PostModel updatedPost) {
    _updatePostInList(updatedPost.id, (_) => updatedPost);
  }

  /// Helper to update a post in the list
  void _updatePostInList(String postId, PostModel Function(PostModel) update) {
    state = state.copyWith(
      posts: state.posts.map((post) {
        if (post.id == postId) {
          return update(post);
        }
        return post;
      }).toList(),
    );
  }

  /// Clear error message
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Get error message from failure
  String _getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return 'No internet connection. Please check your network.';
    } else if (failure is ServerFailure) {
      return 'Server error. Please try again later.';
    } else if (failure is AuthFailure) {
      return 'Please login to continue.';
    }
    return failure.message ?? 'Failed to load feed';
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main feed state provider - connected to real API
final feedProvider = StateNotifierProvider<FeedNotifier, FeedState>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return FeedNotifier(repository);
});

/// Current feed type provider (convenience)
final feedTypeProvider = Provider<FeedType>((ref) {
  return ref.watch(feedProvider).feedType;
});

/// Feed loading provider (convenience)
final feedLoadingProvider = Provider<bool>((ref) {
  return ref.watch(feedProvider).isLoading;
});

/// Feed error provider (convenience)
final feedErrorProvider = Provider<String?>((ref) {
  return ref.watch(feedProvider).errorMessage;
});

/// Feed posts provider (convenience)
final feedPostsProvider = Provider<List<PostModel>>((ref) {
  return ref.watch(feedProvider).posts;
});

/// Single post provider by ID
final postByIdProvider = Provider.family<PostModel?, String>((ref, postId) {
  final posts = ref.watch(feedProvider).posts;
  try {
    return posts.firstWhere((p) => p.id == postId);
  } catch (_) {
    return null;
  }
});

/// Trending posts provider - using real API
/// NOTE: Backend does not have /posts/trending endpoint.
/// This will return an empty list. Use trending hashtags instead.
@Deprecated('Backend API does not have /posts/trending - use trending hashtags instead')
final trendingPostsProvider = FutureProvider.family<List<PostModel>, String?>((ref, period) async {
  debugPrint('[TrendingPostsProvider] 📱 Loading trending posts (endpoint not available)...');
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getTrendingPosts(period: period);
  return result.fold(
    (failure) {
      debugPrint('[TrendingPostsProvider] ❌ Failed: ${failure.message}');
      return <PostModel>[];
    },
    (response) {
      debugPrint('[TrendingPostsProvider] ✅ Loaded ${response.items.length} posts');
      return response.items;
    },
  );
});

/// Saved posts provider - using real API
final savedPostsProvider = FutureProvider<List<PostModel>>((ref) async {
  debugPrint('[SavedPostsProvider] 📱 Loading saved posts...');
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getSavedPosts();
  return result.fold(
    (failure) {
      debugPrint('[SavedPostsProvider] ❌ Failed: ${failure.message}');
      return <PostModel>[];
    },
    (response) {
      debugPrint('[SavedPostsProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});

/// User posts provider - using real API
final userPostsProvider = FutureProvider.family<List<PostModel>, String>((ref, userId) async {
  debugPrint('[UserPostsProvider] 📱 Loading posts for user: $userId');
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getUserPosts(userId);
  return result.fold(
    (failure) {
      debugPrint('[UserPostsProvider] ❌ Failed: ${failure.message}');
      return <PostModel>[];
    },
    (response) {
      debugPrint('[UserPostsProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});
