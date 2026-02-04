import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../data/models/post_model.dart';

/// Abstract repository interface for post operations
abstract class PostsRepository {
  /// Get feed posts
  Future<Result<PaginatedResponse<PostModel>>> getFeed({
    String? cursor,
    int limit = 20,
  });

  /// Get following feed
  Future<Result<PaginatedResponse<PostModel>>> getFollowingFeed({
    String? cursor,
    int limit = 20,
  });

  /// Get single post by ID
  Future<Result<PostModel>> getPost(String postId);

  /// Create a new post
  Future<Result<PostModel>> createPost(CreatePostRequest request);

  /// Update a post
  Future<Result<PostModel>> updatePost(String postId, UpdatePostRequest request);

  /// Delete a post
  Future<Result<void>> deletePost(String postId);

  /// Like a post
  Future<Result<void>> likePost(String postId);

  /// Unlike a post
  Future<Result<void>> unlikePost(String postId);

  /// Save a post
  Future<Result<void>> savePost(String postId);

  /// Unsave a post
  Future<Result<void>> unsavePost(String postId);

  /// Get saved posts
  Future<Result<PaginatedResponse<PostModel>>> getSavedPosts({
    String? cursor,
    int limit = 20,
  });

  /// Share a post
  Future<Result<void>> sharePost(String postId);

  /// Get post comments
  Future<Result<PaginatedResponse<CommentModel>>> getComments(
    String postId, {
    String? cursor,
    int limit = 20,
  });

  /// Add comment to post
  Future<Result<CommentModel>> addComment(String postId, AddCommentRequest request);

  /// Delete comment
  Future<Result<void>> deleteComment(String postId, String commentId);

  /// Like comment
  /// NOTE: This endpoint is not implemented in the backend API.
  /// Calling this will throw UnimplementedError.
  @Deprecated('Backend API does not support comment likes')
  Future<Result<void>> likeComment(String postId, String commentId);

  /// Unlike comment
  /// NOTE: This endpoint is not implemented in the backend API.
  /// Calling this will throw UnimplementedError.
  @Deprecated('Backend API does not support comment likes')
  Future<Result<void>> unlikeComment(String postId, String commentId);

  /// Get comment replies
  Future<Result<PaginatedResponse<CommentModel>>> getCommentReplies(
    String postId,
    String commentId, {
    String? cursor,
    int limit = 20,
  });

  /// Reply to comment
  Future<Result<CommentModel>> replyToComment(
    String postId,
    String commentId,
    AddCommentRequest request,
  );

  /// Get users who liked a post
  Future<Result<PaginatedResponse<dynamic>>> getPostLikes(
    String postId, {
    String? cursor,
    int limit = 20,
  });

  /// Report a post
  Future<Result<void>> reportPost(String postId, ReportPostRequest request);

  /// Get user's posts
  Future<Result<PaginatedResponse<PostModel>>> getUserPosts(
    String userId, {
    String? cursor,
    int limit = 20,
  });

  /// Get trending posts
  /// NOTE: This endpoint is not implemented in the backend API.
  /// Use /hashtags/trending for trending content instead.
  /// This method returns an empty list.
  @Deprecated('Backend API does not have /posts/trending - use trending hashtags instead')
  Future<Result<PaginatedResponse<PostModel>>> getTrendingPosts({
    String? period,
    String? cursor,
    int limit = 20,
  });
}
