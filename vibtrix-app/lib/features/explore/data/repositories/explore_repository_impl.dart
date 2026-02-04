import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../../../core/network/error_handler.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../search/data/models/search_model.dart';
import '../../domain/repositories/explore_repository.dart';
import '../datasources/explore_api_service.dart';
import '../models/explore_model.dart';

/// Concrete implementation of ExploreRepository
/// Uses actual backend endpoints
class ExploreRepositoryImpl implements ExploreRepository {
  final ExploreApiService _apiService;

  ExploreRepositoryImpl(this._apiService);

  @override
  Future<Result<ExploreFeedModel>> getExploreFeed() async {
    // The backend doesn't have a combined explore feed endpoint
    // Return an empty model - the UI will load individual sections
    return Right(ExploreFeedModel(
      trendingPosts: [],
      trendingHashtags: [],
      suggestedUsers: [],
      activeCompetitions: [],
      categories: [],
    ));
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getDiscoverPosts({
    String? category,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      debugPrint('[ExploreRepo] Getting discover posts...');
      final response = await _apiService.getDiscoverPosts(
        cursor: cursor,
        limit: limit,
      );
      debugPrint('[ExploreRepo] Got ${response.posts.length} posts');
      return Right(PaginatedResponse<PostModel>(
        items: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.nextCursor != null,
      ));
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<SimpleUserModel>>> getDiscoverUsers({int limit = 10}) async {
    try {
      debugPrint('[ExploreRepo] Getting recently joined users...');
      final response = await _apiService.getRecentlyJoinedUsers(limit: limit);
      debugPrint('[ExploreRepo] Got ${response.users.length} users');
      return Right(response.users);
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<CompetitionModel>>> getDiscoverCompetitions({int limit = 10}) async {
    try {
      debugPrint('[ExploreRepo] Getting competitions...');
      final competitions = await _apiService.getCompetitions(
        status: 'active',
        limit: limit,
      );
      debugPrint('[ExploreRepo] Got ${competitions.length} competitions');
      return Right(competitions);
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<PostModel>>> getTrendingPosts({int limit = 20}) async {
    try {
      debugPrint('[ExploreRepo] Getting trending posts (using for-you)...');
      final response = await _apiService.getForYouFeed(limit: limit);
      debugPrint('[ExploreRepo] Got ${response.posts.length} trending posts');
      return Right(response.posts);
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<HashtagModel>>> getTrendingHashtags({int limit = 10}) async {
    try {
      debugPrint('[ExploreRepo] Getting trending hashtags...');
      final response = await _apiService.getTrendingHashtags(limit: limit);
      debugPrint('[ExploreRepo] Got ${response.hashtags.length} hashtags');
      // Convert TrendingHashtag to HashtagModel
      final hashtags = response.hashtags.map((h) => HashtagModel(
        name: h.hashtag.replaceFirst('#', ''),
        postCount: h.count,
      )).toList();
      return Right(hashtags);
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<SimpleUserModel>>> getTrendingCreators({int limit = 10}) async {
    // Backend doesn't have trending creators endpoint - use recently joined
    return getDiscoverUsers(limit: limit);
  }

  @override
  Future<Result<List<ExploreCategoryModel>>> getCategories() async {
    // Backend doesn't have categories - return empty list
    return const Right([]);
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getPostsByCategory(
    String categoryId, {
    String? cursor,
    int limit = 20,
  }) async {
    // Backend doesn't have category posts - use discover posts
    return getDiscoverPosts(cursor: cursor, limit: limit);
  }

  @override
  Future<Result<HashtagDetailModel>> getHashtagDetail(String hashtag) async {
    // Backend doesn't have hashtag detail - return basic info
    return Right(HashtagDetailModel(
      name: hashtag,
      postCount: 0,
      isFollowing: false,
    ));
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getPostsByHashtag(
    String hashtag, {
    String? cursor,
    int limit = 20,
  }) async {
    try {
      debugPrint('[ExploreRepo] Searching posts by hashtag: #$hashtag');
      final response = await _apiService.searchPosts(
        query: '#$hashtag',
        cursor: cursor,
      );
      debugPrint('[ExploreRepo] Got ${response.posts.length} posts for hashtag');
      return Right(PaginatedResponse<PostModel>(
        items: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.nextCursor != null,
      ));
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getForYouFeed({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      debugPrint('[ExploreRepo] Getting for-you feed...');
      final response = await _apiService.getForYouFeed(
        cursor: cursor,
        limit: limit,
      );
      debugPrint('[ExploreRepo] Got ${response.posts.length} for-you posts');
      return Right(PaginatedResponse<PostModel>(
        items: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.nextCursor != null,
      ));
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<PostModel>>> getFollowingFeed({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      debugPrint('[ExploreRepo] Getting following feed...');
      final response = await _apiService.getFollowingFeed(
        cursor: cursor,
        limit: limit,
      );
      debugPrint('[ExploreRepo] Got ${response.posts.length} following posts');
      return Right(PaginatedResponse<PostModel>(
        items: response.posts,
        nextCursor: response.nextCursor,
        hasMore: response.nextCursor != null,
      ));
    } on DioException catch (e) {
      debugPrint('[ExploreRepo] DioException: ${e.message}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[ExploreRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<FeaturedContentModel>>> getFeaturedContent() async {
    // Backend doesn't have featured content - return empty list
    return const Right([]);
  }

  @override
  Future<Result<List<SimpleUserModel>>> getFeaturedCreators({int limit = 10}) async {
    // Backend doesn't have featured creators - use recently joined
    return getDiscoverUsers(limit: limit);
  }
}
