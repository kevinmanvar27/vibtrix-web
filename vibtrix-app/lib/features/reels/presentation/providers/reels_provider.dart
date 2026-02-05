import 'package:flutter/foundation.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers/repository_providers.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../posts/domain/repositories/posts_repository.dart';

// ============================================================================
// Reels State
// ============================================================================

class ReelsState {
  final List<PostModel> reels;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;
  final int currentIndex;

  const ReelsState({
    this.reels = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
    this.currentIndex = 0,
  });

  ReelsState copyWith({
    List<PostModel>? reels,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    int? currentIndex,
    bool clearError = false,
  }) {
    return ReelsState(
      reels: reels ?? this.reels,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      currentIndex: currentIndex ?? this.currentIndex,
    );
  }
}

// ============================================================================
// Reels Notifier
// ============================================================================

class ReelsNotifier extends StateNotifier<ReelsState> {
  final PostsRepository _repository;
  final String? initialPostId;

  ReelsNotifier(this._repository, {this.initialPostId}) : super(const ReelsState()) {
    loadReels();
  }

  /// Load reels (video posts only) from API
  Future<void> loadReels() async {
    debugPrint('[ReelsProvider] 🎬 Loading reels...');
    
    state = state.copyWith(
      isLoading: true,
      clearError: true,
      reels: [],
      cursor: null,
      hasMore: true,
    );

    try {
      // If we have an initial post ID, fetch that post first
      PostModel? initialPost;
      if (initialPostId != null) {
        debugPrint('[ReelsProvider] 📌 Fetching initial post: $initialPostId');
        final postResult = await _repository.getPost(initialPostId!);
        postResult.fold(
          (failure) {
            debugPrint('[ReelsProvider] ⚠️ Could not fetch initial post: ${failure.message}');
          },
          (post) {
            if (post.media?.isVideo ?? false) {
              initialPost = post;
              debugPrint('[ReelsProvider] ✅ Got initial post: ${post.id}');
            }
          },
        );
      }

      // Get feed posts and filter for videos only
      final result = await _repository.getFeed(limit: 50);

      result.fold(
        (failure) {
          debugPrint('[ReelsProvider] ❌ Error loading reels: ${failure.message}');
          state = state.copyWith(
            isLoading: false,
            errorMessage: failure.message,
          );
        },
        (response) {
          // Filter only video posts
          var videoReels = response.data
              .where((post) => post.media?.isVideo ?? false)
              .toList();
          
          debugPrint('[ReelsProvider] ✅ Loaded ${videoReels.length} reels from feed');
          
          // If we have an initial post, put it first and remove duplicates
          if (initialPost != null) {
            // Remove the initial post from the list if it exists
            videoReels = videoReels.where((r) => r.id != initialPostId).toList();
            // Insert at the beginning
            videoReels.insert(0, initialPost!);
            debugPrint('[ReelsProvider] 📌 Placed initial post at index 0');
          }
          
          state = state.copyWith(
            isLoading: false,
            reels: videoReels,
            cursor: response.nextCursor,
            hasMore: response.hasMore && videoReels.length < response.data.length,
            currentIndex: 0, // Always start at 0 since initial post is first
          );
        },
      );
    } catch (e) {
      debugPrint('[ReelsProvider] ❌ Exception loading reels: $e');
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load reels: $e',
      );
    }
  }

  /// Load more reels when reaching end
  Future<void> loadMoreReels() async {
    if (state.isLoadingMore || !state.hasMore || state.cursor == null) return;

    debugPrint('[ReelsProvider] 📥 Loading more reels...');
    state = state.copyWith(isLoadingMore: true);

    try {
      final result = await _repository.getFeed(
        cursor: state.cursor,
        limit: 30,
      );

      result.fold(
        (failure) {
          debugPrint('[ReelsProvider] ❌ Error loading more: ${failure.message}');
          state = state.copyWith(isLoadingMore: false);
        },
        (response) {
          // Filter only video posts
          final videoReels = response.data
              .where((post) => post.media?.isVideo ?? false)
              .toList();
          
          debugPrint('[ReelsProvider] ✅ Loaded ${videoReels.length} more reels');
          
          state = state.copyWith(
            isLoadingMore: false,
            reels: [...state.reels, ...videoReels],
            cursor: response.nextCursor,
            hasMore: response.hasMore,
          );
        },
      );
    } catch (e) {
      debugPrint('[ReelsProvider] ❌ Exception loading more: $e');
      state = state.copyWith(isLoadingMore: false);
    }
  }

  /// Update current index when user scrolls
  void setCurrentIndex(int index) {
    if (index != state.currentIndex) {
      state = state.copyWith(currentIndex: index);
      
      // Load more when near the end
      if (index >= state.reels.length - 3) {
        loadMoreReels();
      }
    }
  }

  /// Toggle like on a reel
  Future<void> toggleLike(String postId) async {
    final index = state.reels.indexWhere((r) => r.id == postId);
    if (index == -1) return;

    final reel = state.reels[index];
    final isLiked = reel.isLiked;

    // Optimistic update
    final updatedReels = [...state.reels];
    updatedReels[index] = reel.copyWith(
      isLiked: !isLiked,
      likesCount: isLiked ? reel.likesCount - 1 : reel.likesCount + 1,
    );
    state = state.copyWith(reels: updatedReels);

    try {
      final result = isLiked
          ? await _repository.unlikePost(postId)
          : await _repository.likePost(postId);

      result.fold(
        (failure) {
          // Revert on failure
          final revertedReels = [...state.reels];
          revertedReels[index] = reel;
          state = state.copyWith(reels: revertedReels);
        },
        (_) {
          debugPrint('[ReelsProvider] ✅ ${isLiked ? 'Unliked' : 'Liked'} reel');
        },
      );
    } catch (e) {
      // Revert on error
      final revertedReels = [...state.reels];
      revertedReels[index] = reel;
      state = state.copyWith(reels: revertedReels);
    }
  }

  /// Toggle bookmark on a reel
  Future<void> toggleBookmark(String postId) async {
    final index = state.reels.indexWhere((r) => r.id == postId);
    if (index == -1) return;

    final reel = state.reels[index];
    final isBookmarked = reel.isBookmarked;

    // Optimistic update
    final updatedReels = [...state.reels];
    updatedReels[index] = reel.copyWith(isBookmarked: !isBookmarked);
    state = state.copyWith(reels: updatedReels);

    try {
      final result = isBookmarked
          ? await _repository.unsavePost(postId)
          : await _repository.savePost(postId);

      result.fold(
        (failure) {
          // Revert on failure
          final revertedReels = [...state.reels];
          revertedReels[index] = reel;
          state = state.copyWith(reels: revertedReels);
        },
        (_) {
          debugPrint('[ReelsProvider] ✅ ${isBookmarked ? 'Unsaved' : 'Saved'} reel');
        },
      );
    } catch (e) {
      // Revert on error
      final revertedReels = [...state.reels];
      revertedReels[index] = reel;
      state = state.copyWith(reels: revertedReels);
    }
  }

  /// Refresh comment count for a reel after adding a comment
  void refreshReelCommentCount(String postId) {
    final index = state.reels.indexWhere((r) => r.id == postId);
    if (index == -1) return;

    final reel = state.reels[index];
    final updatedReels = [...state.reels];
    updatedReels[index] = reel.copyWith(commentsCount: reel.commentsCount + 1);
    state = state.copyWith(reels: updatedReels);
    debugPrint('[ReelsProvider] 💬 Updated comment count for reel $postId');
  }
}

// ============================================================================
// Provider
// ============================================================================

/// Provider for reels with optional initial post ID
final reelsProvider = StateNotifierProvider.family<ReelsNotifier, ReelsState, String?>(
  (ref, initialPostId) {
    final repository = ref.watch(postsRepositoryProvider);
    return ReelsNotifier(repository, initialPostId: initialPostId);
  },
);
