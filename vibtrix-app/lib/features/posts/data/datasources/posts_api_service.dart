import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../../../auth/data/models/user_model.dart';
import '../models/post_model.dart';

part 'posts_api_service.g.dart';

/// Posts API Service - Matches Backend API exactly
/// All endpoints verified against API_DOCUMENTATION.txt
@RestApi()
abstract class PostsApiService {
  factory PostsApiService(Dio dio, {String baseUrl}) = _PostsApiService;

  // ============ FEED ENDPOINTS ============

  /// GET /posts/for-you - Get For You feed
  @GET('/posts/for-you')
  Future<PaginatedResponse<PostModel>> getFeed({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// GET /posts/following - Get Following feed (authenticated)
  @GET('/posts/following')
  Future<PaginatedResponse<PostModel>> getFollowingFeed({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // NOTE: /posts/trending does NOT exist - use /hashtags/trending instead

  // ============ POST CRUD ============

  /// POST /posts - Create a new post
  @POST('/posts')
  Future<PostModel> createPost(@Body() CreatePostRequest request);

  /// GET /posts/{postId} - Get a single post
  @GET('/posts/{postId}')
  Future<PostModel> getPost(@Path('postId') String postId);

  /// PUT /posts/{postId} - Update a post
  @PUT('/posts/{postId}')
  Future<PostModel> updatePost(
    @Path('postId') String postId,
    @Body() UpdatePostRequest request,
  );

  /// DELETE /posts/{postId} - Delete a post
  @DELETE('/posts/{postId}')
  Future<void> deletePost(@Path('postId') String postId);

  // ============ USER POSTS ============

  /// GET /users/{userId}/posts - Get user's posts
  @GET('/users/{userId}/posts')
  Future<PaginatedResponse<PostModel>> getUserPosts(
    @Path('userId') String userId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // ============ LIKE ENDPOINTS ============

  /// POST /posts/{postId}/likes - Like a post
  @POST('/posts/{postId}/likes')
  Future<void> likePost(@Path('postId') String postId);

  /// DELETE /posts/{postId}/likes - Unlike a post
  @DELETE('/posts/{postId}/likes')
  Future<void> unlikePost(@Path('postId') String postId);

  /// GET /posts/{postId}/likes - Get post likes info
  @GET('/posts/{postId}/likes')
  Future<PostLikesResponse> getPostLikes(
    @Path('postId') String postId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // ============ BOOKMARK ENDPOINTS ============

  /// POST /posts/{postId}/bookmark - Bookmark a post
  @POST('/posts/{postId}/bookmark')
  Future<void> savePost(@Path('postId') String postId);

  /// DELETE /posts/{postId}/bookmark - Remove bookmark
  @DELETE('/posts/{postId}/bookmark')
  Future<void> unsavePost(@Path('postId') String postId);

  /// GET /posts/bookmarked - Get bookmarked posts
  @GET('/posts/bookmarked')
  Future<PaginatedResponse<PostModel>> getSavedPosts({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // ============ SHARE & VIEW ============

  /// POST /posts/{postId}/share - Share a post
  @POST('/posts/{postId}/share')
  Future<void> sharePost(@Path('postId') String postId);

  /// POST /posts/{postId}/view - Record a view
  @POST('/posts/{postId}/view')
  Future<void> recordView(@Path('postId') String postId);

  // ============ COMMENTS ============

  /// GET /posts/{postId}/comments - Get comments
  @GET('/posts/{postId}/comments')
  Future<PaginatedResponse<CommentModel>> getComments(
    @Path('postId') String postId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// POST /posts/{postId}/comments - Add a comment
  @POST('/posts/{postId}/comments')
  Future<CommentModel> addComment(
    @Path('postId') String postId,
    @Body() AddCommentRequest request,
  );

  /// DELETE /posts/{postId}/comments/{commentId} - Delete a comment
  @DELETE('/posts/{postId}/comments/{commentId}')
  Future<void> deleteComment(
    @Path('postId') String postId,
    @Path('commentId') String commentId,
  );

  /// GET /posts/{postId}/comments/{commentId}/replies - Get comment replies
  @GET('/posts/{postId}/comments/{commentId}/replies')
  Future<PaginatedResponse<CommentModel>> getCommentReplies(
    @Path('postId') String postId,
    @Path('commentId') String commentId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// POST /posts/{postId}/comments/{commentId}/replies - Reply to a comment
  @POST('/posts/{postId}/comments/{commentId}/replies')
  Future<CommentModel> replyToComment(
    @Path('postId') String postId,
    @Path('commentId') String commentId,
    @Body() AddCommentRequest request,
  );

  // NOTE: Comment likes (POST/DELETE /posts/{postId}/comments/{commentId}/like) do NOT exist

  // ============ REPORTS ============

  /// POST /posts/{postId}/report - Report a post
  @POST('/posts/{postId}/report')
  Future<void> reportPost(
    @Path('postId') String postId,
    @Body() ReportPostRequest request,
  );
}

/// Response model for post likes
class PostLikesResponse {
  final int likes;
  final bool isLikedByUser;

  PostLikesResponse({required this.likes, required this.isLikedByUser});

  factory PostLikesResponse.fromJson(Map<String, dynamic> json) {
    return PostLikesResponse(
      likes: json['likes'] as int? ?? 0,
      isLikedByUser: json['isLikedByUser'] as bool? ?? false,
    );
  }
}
