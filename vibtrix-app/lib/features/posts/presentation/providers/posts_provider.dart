/// Posts state management using Riverpod
/// Handles feed, post creation, likes, comments, and sharing

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../data/models/post_model.dart';
import '../../domain/repositories/posts_repository.dart';

// ============================================================================
// Feed State
// ============================================================================

class FeedState {
  final List<PostModel> posts;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;

  const FeedState({
    this.posts = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
  });

  FeedState copyWith({
    List<PostModel>? posts,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    bool clearError = false,
  }) {
    return FeedState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// Feed Notifier
// ============================================================================

class FeedNotifier extends StateNotifier<FeedState> {
  final PostsRepository _repository;

  FeedNotifier(this._repository) : super(const FeedState());

  /// Load initial feed
  Future<void> loadFeed({bool refresh = false}) async {
    if (state.isLoading) return;

    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        posts: [],
        cursor: null,
        hasMore: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    final result = await _repository.getFeed(limit: 20);

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
          posts: response.data,
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  /// Load more posts (pagination)
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.cursor == null) return;

    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getFeed(
      cursor: state.cursor,
      limit: 20,
    );

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoadingMore: false,
          errorMessage: _getErrorMessage(failure),
        );
      },
      (response) {
        state = state.copyWith(
          isLoadingMore: false,
          posts: [...state.posts, ...response.data],
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  /// Toggle like on a post
  Future<void> toggleLike(String postId) async {
    // Optimistic update
    final index = state.posts.indexWhere((p) => p.id == postId);
    if (index == -1) return;

    final post = state.posts[index];
    final newIsLiked = !post.isLiked;
    final newLikesCount = post.likesCount + (newIsLiked ? 1 : -1);

    final updatedPost = post.copyWith(
      isLiked: newIsLiked,
      likesCount: newLikesCount,
    );

    final newPosts = [...state.posts];
    newPosts[index] = updatedPost;
    state = state.copyWith(posts: newPosts);

    // Make API call
    final result = newIsLiked
        ? await _repository.likePost(postId)
        : await _repository.unlikePost(postId);

    // Revert on failure
    result.fold(
      (failure) {
        newPosts[index] = post;
        state = state.copyWith(posts: newPosts);
      },
      (_) {}, // Success - already updated
    );
  }

  /// Update a post in the list (after edit, etc.)
  void updatePost(PostModel updatedPost) {
    final index = state.posts.indexWhere((p) => p.id == updatedPost.id);
    if (index != -1) {
      final newPosts = [...state.posts];
      newPosts[index] = updatedPost;
      state = state.copyWith(posts: newPosts);
    }
  }

  /// Remove a post from the list
  void removePost(String postId) {
    final newPosts = state.posts.where((p) => p.id != postId).toList();
    state = state.copyWith(posts: newPosts);
  }

  /// Add a new post to the top of the feed
  void addPost(PostModel post) {
    state = state.copyWith(posts: [post, ...state.posts]);
  }

  String _getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return 'No internet connection';
    } else if (failure is ServerFailure) {
      return 'Server error. Please try again.';
    }
    return failure.message ?? 'Failed to load posts';
  }
}

// ============================================================================
// Post Detail State
// ============================================================================

class PostDetailState {
  final PostModel? post;
  final List<CommentModel> comments;
  final bool isLoading;
  final bool isLoadingComments;
  final String? errorMessage;
  final String? commentCursor;
  final bool hasMoreComments;

  const PostDetailState({
    this.post,
    this.comments = const [],
    this.isLoading = false,
    this.isLoadingComments = false,
    this.errorMessage,
    this.commentCursor,
    this.hasMoreComments = true,
  });

  PostDetailState copyWith({
    PostModel? post,
    List<CommentModel>? comments,
    bool? isLoading,
    bool? isLoadingComments,
    String? errorMessage,
    String? commentCursor,
    bool? hasMoreComments,
    bool clearError = false,
    bool clearPost = false,
  }) {
    return PostDetailState(
      post: clearPost ? null : (post ?? this.post),
      comments: comments ?? this.comments,
      isLoading: isLoading ?? this.isLoading,
      isLoadingComments: isLoadingComments ?? this.isLoadingComments,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      commentCursor: commentCursor ?? this.commentCursor,
      hasMoreComments: hasMoreComments ?? this.hasMoreComments,
    );
  }
}

// ============================================================================
// Post Detail Notifier
// ============================================================================

class PostDetailNotifier extends StateNotifier<PostDetailState> {
  final PostsRepository _repository;

  PostDetailNotifier(this._repository) : super(const PostDetailState());

  /// Load post details
  Future<void> loadPost(String postId) async {
    state = state.copyWith(isLoading: true, clearError: true, clearPost: true);

    final result = await _repository.getPost(postId);

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load post',
        );
      },
      (post) {
        state = state.copyWith(isLoading: false, post: post);
        // Load comments after post
        loadComments(postId);
      },
    );
  }

  /// Load comments for a post
  Future<void> loadComments(String postId, {bool refresh = false}) async {
    if (state.isLoadingComments) return;

    if (refresh) {
      state = state.copyWith(
        comments: [],
        commentCursor: null,
        hasMoreComments: true,
      );
    }

    state = state.copyWith(isLoadingComments: true);

    final result = await _repository.getComments(
      postId,
      cursor: refresh ? null : state.commentCursor,
    );

    result.fold(
      (failure) {
        state = state.copyWith(isLoadingComments: false);
      },
      (response) {
        state = state.copyWith(
          isLoadingComments: false,
          comments: refresh ? response.data : [...state.comments, ...response.data],
          commentCursor: response.nextCursor,
          hasMoreComments: response.hasMore,
        );
      },
    );
  }

  /// Add a comment
  Future<bool> addComment(String postId, String content, {String? parentId}) async {
    final request = AddCommentRequest(content: content, parentId: parentId);
    final result = await _repository.addComment(postId, request);

    return result.fold(
      (failure) => false,
      (comment) {
        // Add to top of comments list
        state = state.copyWith(comments: [comment, ...state.comments]);

        // Update comment count on post
        if (state.post != null) {
          state = state.copyWith(
            post: state.post!.copyWith(
              commentsCount: state.post!.commentsCount + 1,
            ),
          );
        }
        return true;
      },
    );
  }

  /// Delete a comment
  Future<bool> deleteComment(String postId, String commentId) async {
    final result = await _repository.deleteComment(postId, commentId);

    return result.fold(
      (failure) => false,
      (_) {
        state = state.copyWith(
          comments: state.comments.where((c) => c.id != commentId).toList(),
        );

        // Update comment count on post
        if (state.post != null) {
          state = state.copyWith(
            post: state.post!.copyWith(
              commentsCount: state.post!.commentsCount > 0 ? state.post!.commentsCount - 1 : 0,
            ),
          );
        }
        return true;
      },
    );
  }

  /// Toggle like on post
  Future<void> toggleLike() async {
    if (state.post == null) return;

    final post = state.post!;
    final newIsLiked = !post.isLiked;
    final newLikesCount = post.likesCount + (newIsLiked ? 1 : -1);

    // Optimistic update
    state = state.copyWith(
      post: post.copyWith(isLiked: newIsLiked, likesCount: newLikesCount),
    );

    final result = newIsLiked
        ? await _repository.likePost(post.id)
        : await _repository.unlikePost(post.id);

    // Revert on failure
    result.fold(
      (failure) {
        state = state.copyWith(post: post);
      },
      (_) {},
    );
  }

  /// Toggle save/bookmark
  Future<void> toggleSave() async {
    if (state.post == null) return;

    final post = state.post!;
    final newIsBookmarked = !post.isBookmarked;

    // Optimistic update
    state = state.copyWith(post: post.copyWith(isBookmarked: newIsBookmarked));

    final result = newIsBookmarked
        ? await _repository.savePost(post.id)
        : await _repository.unsavePost(post.id);

    // Revert on failure
    result.fold(
      (failure) {
        state = state.copyWith(post: post);
      },
      (_) {},
    );
  }

  /// Clear state
  void clear() {
    state = const PostDetailState();
  }
}

// ============================================================================
// Create Post State
// ============================================================================

class CreatePostState {
  final bool isCreating;
  final double uploadProgress;
  final String? errorMessage;
  final PostModel? createdPost;

  const CreatePostState({
    this.isCreating = false,
    this.uploadProgress = 0,
    this.errorMessage,
    this.createdPost,
  });

  CreatePostState copyWith({
    bool? isCreating,
    double? uploadProgress,
    String? errorMessage,
    PostModel? createdPost,
    bool clearError = false,
    bool clearPost = false,
  }) {
    return CreatePostState(
      isCreating: isCreating ?? this.isCreating,
      uploadProgress: uploadProgress ?? this.uploadProgress,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      createdPost: clearPost ? null : (createdPost ?? this.createdPost),
    );
  }
}

class CreatePostNotifier extends StateNotifier<CreatePostState> {
  final PostsRepository _repository;

  CreatePostNotifier(this._repository) : super(const CreatePostState());

  /// Create a new post
  /// [content] - The post caption/content
  /// [mediaIds] - List of media IDs from the upload endpoint
  Future<bool> createPost({
    String content = '',
    List<String> mediaIds = const [],
  }) async {
    state = state.copyWith(
      isCreating: true,
      uploadProgress: 0,
      clearError: true,
      clearPost: true,
    );

    final request = CreatePostRequest(
      content: content,
      mediaIds: mediaIds,
    );

    final result = await _repository.createPost(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isCreating: false,
          errorMessage: failure.message ?? 'Failed to create post',
        );
        return false;
      },
      (post) {
        state = state.copyWith(
          isCreating: false,
          uploadProgress: 1.0,
          createdPost: post,
        );
        return true;
      },
    );
  }

  /// Reset state
  void reset() {
    state = const CreatePostState();
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main feed provider
final feedProvider = StateNotifierProvider<FeedNotifier, FeedState>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return FeedNotifier(repository);
});

/// Post detail provider - family for different post IDs
final postDetailProvider =
    StateNotifierProvider.family<PostDetailNotifier, PostDetailState, String>(
  (ref, postId) {
    final repository = ref.watch(postsRepositoryProvider);
    final notifier = PostDetailNotifier(repository);
    // Auto-load post when provider is created
    notifier.loadPost(postId);
    return notifier;
  },
);

/// Create post provider
final createPostProvider =
    StateNotifierProvider<CreatePostNotifier, CreatePostState>((ref) {
  final repository = ref.watch(postsRepositoryProvider);
  return CreatePostNotifier(repository);
});

/// User posts provider - for profile page
final userPostsProvider =
    FutureProvider.family<PaginatedResponse<PostModel>, String>((ref, userId) async {
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getUserPosts(userId);
  return result.fold(
    (failure) => throw Exception(failure.message),
    (response) => response,
  );
});

/// Saved posts provider
final savedPostsProvider = FutureProvider<PaginatedResponse<PostModel>>((ref) async {
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getSavedPosts();
  return result.fold(
    (failure) => throw Exception(failure.message),
    (response) => response,
  );
});

/// Trending posts provider
/// NOTE: Backend does not have /posts/trending endpoint.
/// This will return an empty list. Use trending hashtags instead.
@Deprecated('Backend API does not have /posts/trending - use trending hashtags instead')
final trendingPostsProvider = FutureProvider<List<PostModel>>((ref) async {
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getTrendingPosts();
  return result.fold(
    (failure) => <PostModel>[], // Return empty list on failure
    (response) => response.items,
  );
});
