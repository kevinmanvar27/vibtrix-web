import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../search/data/models/search_model.dart';
import '../models/explore_model.dart';

part 'explore_api_service.g.dart';

/// Explore API Service
/// Maps to actual backend endpoints
@RestApi()
abstract class ExploreApiService {
  factory ExploreApiService(Dio dio, {String baseUrl}) = _ExploreApiService;

  // ==================== POSTS ====================
  
  /// For You personalized feed - uses /posts/for-you
  @GET('/posts/for-you')
  Future<PostsPageResponse> getForYouFeed({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// Get all posts (discover) - uses /posts/for-you
  @GET('/posts/for-you')
  Future<PostsPageResponse> getDiscoverPosts({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// Following feed - uses /posts/following
  @GET('/posts/following')
  Future<PostsPageResponse> getFollowingFeed({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // ==================== USERS ====================
  
  /// Search users - uses /users/search
  @GET('/users/search')
  Future<UsersSearchResponse> searchUsers({
    @Query('q') required String query,
  });

  /// Get recently joined users - uses /users/recently-joined
  @GET('/users/recently-joined')
  Future<UsersListResponse> getRecentlyJoinedUsers({
    @Query('limit') int limit = 10,
  });

  // ==================== HASHTAGS ====================
  
  /// Trending hashtags - uses /hashtags/trending
  @GET('/hashtags/trending')
  Future<TrendingHashtagsResponse> getTrendingHashtags({
    @Query('limit') int limit = 10,
    @Query('period') String period = '7d',
  });

  // ==================== COMPETITIONS ====================
  
  /// Get competitions - uses /competitions
  @GET('/competitions')
  Future<List<CompetitionModel>> getCompetitions({
    @Query('status') String? status,
    @Query('limit') int limit = 10,
  });

  // ==================== SEARCH ====================
  
  /// Search posts - uses /search
  @GET('/search')
  Future<PostsPageResponse> searchPosts({
    @Query('q') required String query,
    @Query('cursor') String? cursor,
  });
}

// ==================== RESPONSE MODELS ====================

/// Response model for posts pagination (matches backend PostsPage)
class PostsPageResponse {
  final List<PostModel> posts;
  final String? nextCursor;

  PostsPageResponse({
    required this.posts,
    this.nextCursor,
  });

  factory PostsPageResponse.fromJson(Map<String, dynamic> json) {
    return PostsPageResponse(
      posts: (json['posts'] as List<dynamic>?)
          ?.map((e) => PostModel.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      nextCursor: json['nextCursor'] as String?,
    );
  }
}

/// Response model for users search
class UsersSearchResponse {
  final List<SimpleUserModel> users;

  UsersSearchResponse({required this.users});

  factory UsersSearchResponse.fromJson(Map<String, dynamic> json) {
    return UsersSearchResponse(
      users: (json['users'] as List<dynamic>?)
          ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}

/// Response model for users list
class UsersListResponse {
  final List<SimpleUserModel> users;

  UsersListResponse({required this.users});

  factory UsersListResponse.fromJson(Map<String, dynamic> json) {
    return UsersListResponse(
      users: (json['users'] as List<dynamic>?)
          ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}

/// Response model for trending hashtags
class TrendingHashtagsResponse {
  final List<TrendingHashtag> hashtags;
  final String period;

  TrendingHashtagsResponse({
    required this.hashtags,
    required this.period,
  });

  factory TrendingHashtagsResponse.fromJson(Map<String, dynamic> json) {
    return TrendingHashtagsResponse(
      hashtags: (json['hashtags'] as List<dynamic>?)
          ?.map((e) => TrendingHashtag.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      period: json['period'] as String? ?? '7d',
    );
  }
}

/// Trending hashtag model
class TrendingHashtag {
  final String hashtag;
  final int count;
  final int recentPosts;

  TrendingHashtag({
    required this.hashtag,
    required this.count,
    required this.recentPosts,
  });

  factory TrendingHashtag.fromJson(Map<String, dynamic> json) {
    return TrendingHashtag(
      hashtag: json['hashtag'] as String? ?? '',
      count: json['count'] as int? ?? 0,
      recentPosts: json['recentPosts'] as int? ?? 0,
    );
  }
}
