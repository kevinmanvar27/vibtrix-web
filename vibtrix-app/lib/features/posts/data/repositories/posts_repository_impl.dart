import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/models/base_response.dart';
import '../../domain/repositories/posts_repository.dart';
import '../datasources/posts_api_service.dart';
import '../models/post_model.dart';

/// Implementation of PostsRepository
class PostsRepositoryImpl implements PostsRepository {
  final PostsApiService _apiService;

  PostsRepositoryImpl({required PostsApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<PaginatedResponse<PostModel>>> getFeed({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getFeed(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getFollowingFeed({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getFollowingFeed(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PostModel>> getPost(String postId) async {
    try {
      final post = await _apiService.getPost(postId);
      return Right(post);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PostModel>> createPost(CreatePostRequest request) async {
    try {
      final post = await _apiService.createPost(request);
      return Right(post);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PostModel>> updatePost(String postId, UpdatePostRequest request) async {
    try {
      final post = await _apiService.updatePost(postId, request);
      return Right(post);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deletePost(String postId) async {
    try {
      await _apiService.deletePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> likePost(String postId) async {
    try {
      await _apiService.likePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> unlikePost(String postId) async {
    try {
      await _apiService.unlikePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> savePost(String postId) async {
    try {
      await _apiService.savePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> unsavePost(String postId) async {
    try {
      await _apiService.unsavePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getSavedPosts({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getSavedPosts(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getLikedPosts({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getLikedPosts(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> sharePost(String postId) async {
    try {
      await _apiService.sharePost(postId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<CommentModel>>> getComments(
    String postId, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getComments(postId, cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<CommentModel>> addComment(String postId, AddCommentRequest request) async {
    try {
      final comment = await _apiService.addComment(postId, request);
      return Right(comment);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteComment(String postId, String commentId) async {
    try {
      await _apiService.deleteComment(postId, commentId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> likeComment(String postId, String commentId) async {
    // NOTE: Comment likes endpoint does NOT exist in backend
    return Left(const ServerFailure(message: 'Comment likes not implemented'));
  }

  @override
  Future<Result<void>> unlikeComment(String postId, String commentId) async {
    // NOTE: Comment unlikes endpoint does NOT exist in backend
    return Left(const ServerFailure(message: 'Comment unlikes not implemented'));
  }

  @override
  Future<Result<PaginatedResponse<CommentModel>>> getCommentReplies(
    String postId,
    String commentId, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getCommentReplies(
        postId,
        commentId,
        cursor: cursor,
        limit: limit,
      );
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<CommentModel>> replyToComment(
    String postId,
    String commentId,
    AddCommentRequest request,
  ) async {
    try {
      final reply = await _apiService.replyToComment(postId, commentId, request);
      return Right(reply);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<dynamic>>> getPostLikes(
    String postId, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getPostLikes(postId, cursor: cursor, limit: limit);
      // Convert PostLikesResponse to PaginatedResponse
      // The API returns likes count and isLikedByUser, not a list of users
      return Right(PaginatedResponse<dynamic>(
        items: [], // API doesn't return list of users who liked
        nextCursor: null,
        hasMore: false,
        totalCount: response.likes,
      ));
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> reportPost(String postId, ReportPostRequest request) async {
    try {
      await _apiService.reportPost(postId, request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getUserPosts(
    String userId, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getUserPosts(userId, cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getTrendingPosts({
    String? period,
    String? cursor,
    int limit = 20,
  }) async {
    // NOTE: /posts/trending does NOT exist in backend
    // Use /hashtags/trending for trending hashtags instead
    // Return for-you feed as fallback
    try {
      final response = await _apiService.getFeed(
        cursor: cursor,
        limit: limit,
      );
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
