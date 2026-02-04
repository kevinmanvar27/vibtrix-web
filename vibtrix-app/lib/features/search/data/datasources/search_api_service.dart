import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../models/search_model.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';

part 'search_api_service.g.dart';

/// Search API Service - Matches Backend API exactly
/// All endpoints verified against API_DOCUMENTATION.txt
@RestApi()
abstract class SearchApiService {
  factory SearchApiService(Dio dio, {String baseUrl}) = _SearchApiService;

  // ============ SEARCH ENDPOINTS ============

  /// GET /search - Global search
  @GET('/search')
  Future<SearchResultModel> search({
    @Query('q') required String query,
    @Query('type') String? type, // 'all', 'users', 'posts', 'hashtags'
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// GET /users/search - Search users
  @GET('/users/search')
  Future<PaginatedResponse<SimpleUserModel>> searchUsers({
    @Query('q') required String query,
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // NOTE: /search/posts does NOT exist - use /search with type='posts' instead
  // NOTE: /search/hashtags does NOT exist - use /hashtags/trending instead

  // ============ HASHTAG ENDPOINTS ============

  /// GET /hashtags/trending - Get trending hashtags
  @GET('/hashtags/trending')
  Future<TrendingHashtagsModel> getTrendingHashtags({
    @Query('limit') int limit = 10,
    @Query('period') String? period, // 'day', 'week', 'month'
  });

  /// GET /hashtags/{hashtag}/posts - Get posts by hashtag
  @GET('/hashtags/{hashtag}/posts')
  Future<PaginatedResponse<PostModel>> getPostsByHashtag(
    @Path('hashtag') String hashtag, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // NOTE: Recent searches and suggestions endpoints may not exist in backend
  // Keeping them for future implementation or remove if not needed
}

// Additional models for search
@JsonSerializable()
class RecentSearchModel {
  final String id;
  final String query;
  final String type; // 'text', 'user', 'hashtag'
  final String? targetId;
  final String? targetName;
  final String? targetImage;
  final DateTime searchedAt;

  RecentSearchModel({
    required this.id,
    required this.query,
    required this.type,
    this.targetId,
    this.targetName,
    this.targetImage,
    required this.searchedAt,
  });

  factory RecentSearchModel.fromJson(Map<String, dynamic> json) =>
      _$RecentSearchModelFromJson(json);
  Map<String, dynamic> toJson() => _$RecentSearchModelToJson(this);
}

@JsonSerializable()
class SaveRecentSearchRequest {
  final String query;
  final String type;
  final String? targetId;

  SaveRecentSearchRequest({
    required this.query,
    required this.type,
    this.targetId,
  });

  factory SaveRecentSearchRequest.fromJson(Map<String, dynamic> json) =>
      _$SaveRecentSearchRequestFromJson(json);
  Map<String, dynamic> toJson() => _$SaveRecentSearchRequestToJson(this);
}

@JsonSerializable()
class SearchSuggestionsModel {
  final List<String> textSuggestions;
  final List<SimpleUserModel> userSuggestions;
  final List<HashtagModel> hashtagSuggestions;

  SearchSuggestionsModel({
    required this.textSuggestions,
    required this.userSuggestions,
    required this.hashtagSuggestions,
  });

  factory SearchSuggestionsModel.fromJson(Map<String, dynamic> json) =>
      _$SearchSuggestionsModelFromJson(json);
  Map<String, dynamic> toJson() => _$SearchSuggestionsModelToJson(this);
}
