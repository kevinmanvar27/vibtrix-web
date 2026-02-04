import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';

part 'search_model.g.dart';

// ============ SEARCH TYPE ENUM ============

enum SearchType {
  @JsonValue('all')
  all,
  @JsonValue('users')
  users,
  @JsonValue('posts')
  posts,
  @JsonValue('competitions')
  competitions,
  @JsonValue('hashtags')
  hashtags,
}

// ============ RESPONSE MODELS ============

@JsonSerializable()
class SearchResultModel {
  final List<SimpleUserModel> users;
  final List<PostModel> posts;
  final List<CompetitionModel> competitions;
  final List<HashtagModel> hashtags;

  const SearchResultModel({
    this.users = const [],
    this.posts = const [],
    this.competitions = const [],
    this.hashtags = const [],
  });

  factory SearchResultModel.fromJson(Map<String, dynamic> json) =>
      _$SearchResultModelFromJson(json);

  Map<String, dynamic> toJson() => _$SearchResultModelToJson(this);

  bool get isEmpty => 
      users.isEmpty && posts.isEmpty && competitions.isEmpty && hashtags.isEmpty;
}

/// Global search result model - combines all search types
@JsonSerializable()
class GlobalSearchResultModel {
  final List<SimpleUserModel> users;
  final List<PostModel> posts;
  final List<CompetitionModel> competitions;
  final List<HashtagModel> hashtags;
  final String? nextCursor;
  final bool hasMore;

  const GlobalSearchResultModel({
    this.users = const [],
    this.posts = const [],
    this.competitions = const [],
    this.hashtags = const [],
    this.nextCursor,
    this.hasMore = false,
  });

  factory GlobalSearchResultModel.fromJson(Map<String, dynamic> json) =>
      _$GlobalSearchResultModelFromJson(json);

  Map<String, dynamic> toJson() => _$GlobalSearchResultModelToJson(this);

  bool get isEmpty => 
      users.isEmpty && posts.isEmpty && competitions.isEmpty && hashtags.isEmpty;
}

@JsonSerializable()
class HashtagModel {
  final String? id;
  final String name;
  @JsonKey(name: 'postsCount', defaultValue: 0)
  final int postCount;
  final bool isTrending;
  final int? trendingRank;

  const HashtagModel({
    this.id,
    required this.name,
    this.postCount = 0,
    this.isTrending = false,
    this.trendingRank,
  });

  factory HashtagModel.fromJson(Map<String, dynamic> json) =>
      _$HashtagModelFromJson(json);

  Map<String, dynamic> toJson() => _$HashtagModelToJson(this);

  String get displayName => name.startsWith('#') ? name : '#$name';
}

@JsonSerializable()
class TrendingHashtagsModel {
  final List<HashtagModel> hashtags;
  final DateTime? lastUpdated;

  const TrendingHashtagsModel({
    this.hashtags = const [],
    this.lastUpdated,
  });

  factory TrendingHashtagsModel.fromJson(Map<String, dynamic> json) =>
      _$TrendingHashtagsModelFromJson(json);

  Map<String, dynamic> toJson() => _$TrendingHashtagsModelToJson(this);
}

/// Trending search model
@JsonSerializable()
class TrendingSearchModel {
  final String id;
  final String query;
  final int searchCount;
  final int rank;
  final SearchType? type;
  final DateTime? lastSearched;

  const TrendingSearchModel({
    required this.id,
    required this.query,
    this.searchCount = 0,
    this.rank = 0,
    this.type,
    this.lastSearched,
  });

  factory TrendingSearchModel.fromJson(Map<String, dynamic> json) =>
      _$TrendingSearchModelFromJson(json);

  Map<String, dynamic> toJson() => _$TrendingSearchModelToJson(this);
}

/// Search history model
@JsonSerializable()
class SearchHistoryModel {
  final String id;
  final String query;
  final SearchType type;
  final DateTime searchedAt;

  const SearchHistoryModel({
    required this.id,
    required this.query,
    required this.type,
    required this.searchedAt,
  });

  factory SearchHistoryModel.fromJson(Map<String, dynamic> json) =>
      _$SearchHistoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$SearchHistoryModelToJson(this);
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class SearchRequest {
  final String query;
  final SearchType? type;
  final int? limit;
  final String? cursor;

  const SearchRequest({
    required this.query,
    this.type,
    this.limit,
    this.cursor,
  });

  factory SearchRequest.fromJson(Map<String, dynamic> json) =>
      _$SearchRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SearchRequestToJson(this);
}

/// Request model for adding to search history
@JsonSerializable()
class AddSearchHistoryRequest {
  final String query;
  final SearchType type;

  const AddSearchHistoryRequest({
    required this.query,
    required this.type,
  });

  factory AddSearchHistoryRequest.fromJson(Map<String, dynamic> json) =>
      _$AddSearchHistoryRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AddSearchHistoryRequestToJson(this);
}
