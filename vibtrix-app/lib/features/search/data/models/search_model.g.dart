// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SearchResultModel _$SearchResultModelFromJson(Map<String, dynamic> json) =>
    SearchResultModel(
      users:
          (json['users'] as List<dynamic>?)
              ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      posts:
          (json['posts'] as List<dynamic>?)
              ?.map((e) => PostModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      competitions:
          (json['competitions'] as List<dynamic>?)
              ?.map((e) => CompetitionModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      hashtags:
          (json['hashtags'] as List<dynamic>?)
              ?.map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$SearchResultModelToJson(SearchResultModel instance) =>
    <String, dynamic>{
      'users': instance.users,
      'posts': instance.posts,
      'competitions': instance.competitions,
      'hashtags': instance.hashtags,
    };

GlobalSearchResultModel _$GlobalSearchResultModelFromJson(
  Map<String, dynamic> json,
) => GlobalSearchResultModel(
  users:
      (json['users'] as List<dynamic>?)
          ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  posts:
      (json['posts'] as List<dynamic>?)
          ?.map((e) => PostModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  competitions:
      (json['competitions'] as List<dynamic>?)
          ?.map((e) => CompetitionModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  hashtags:
      (json['hashtags'] as List<dynamic>?)
          ?.map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  nextCursor: json['nextCursor'] as String?,
  hasMore: json['hasMore'] as bool? ?? false,
);

Map<String, dynamic> _$GlobalSearchResultModelToJson(
  GlobalSearchResultModel instance,
) => <String, dynamic>{
  'users': instance.users,
  'posts': instance.posts,
  'competitions': instance.competitions,
  'hashtags': instance.hashtags,
  'nextCursor': instance.nextCursor,
  'hasMore': instance.hasMore,
};

HashtagModel _$HashtagModelFromJson(Map<String, dynamic> json) => HashtagModel(
  id: json['id'] as String?,
  name: json['name'] as String,
  postCount: (json['postsCount'] as num?)?.toInt() ?? 0,
  isTrending: json['isTrending'] as bool? ?? false,
  trendingRank: (json['trendingRank'] as num?)?.toInt(),
);

Map<String, dynamic> _$HashtagModelToJson(HashtagModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'postsCount': instance.postCount,
      'isTrending': instance.isTrending,
      'trendingRank': instance.trendingRank,
    };

TrendingHashtagsModel _$TrendingHashtagsModelFromJson(
  Map<String, dynamic> json,
) => TrendingHashtagsModel(
  hashtags:
      (json['hashtags'] as List<dynamic>?)
          ?.map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  lastUpdated:
      json['lastUpdated'] == null
          ? null
          : DateTime.parse(json['lastUpdated'] as String),
);

Map<String, dynamic> _$TrendingHashtagsModelToJson(
  TrendingHashtagsModel instance,
) => <String, dynamic>{
  'hashtags': instance.hashtags,
  'lastUpdated': instance.lastUpdated?.toIso8601String(),
};

TrendingSearchModel _$TrendingSearchModelFromJson(Map<String, dynamic> json) =>
    TrendingSearchModel(
      id: json['id'] as String,
      query: json['query'] as String,
      searchCount: (json['searchCount'] as num?)?.toInt() ?? 0,
      rank: (json['rank'] as num?)?.toInt() ?? 0,
      type: $enumDecodeNullable(_$SearchTypeEnumMap, json['type']),
      lastSearched:
          json['lastSearched'] == null
              ? null
              : DateTime.parse(json['lastSearched'] as String),
    );

Map<String, dynamic> _$TrendingSearchModelToJson(
  TrendingSearchModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'query': instance.query,
  'searchCount': instance.searchCount,
  'rank': instance.rank,
  'type': _$SearchTypeEnumMap[instance.type],
  'lastSearched': instance.lastSearched?.toIso8601String(),
};

const _$SearchTypeEnumMap = {
  SearchType.all: 'all',
  SearchType.users: 'users',
  SearchType.posts: 'posts',
  SearchType.competitions: 'competitions',
  SearchType.hashtags: 'hashtags',
};

SearchHistoryModel _$SearchHistoryModelFromJson(Map<String, dynamic> json) =>
    SearchHistoryModel(
      id: json['id'] as String,
      query: json['query'] as String,
      type: $enumDecode(_$SearchTypeEnumMap, json['type']),
      searchedAt: DateTime.parse(json['searchedAt'] as String),
    );

Map<String, dynamic> _$SearchHistoryModelToJson(SearchHistoryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'query': instance.query,
      'type': _$SearchTypeEnumMap[instance.type]!,
      'searchedAt': instance.searchedAt.toIso8601String(),
    };

SearchRequest _$SearchRequestFromJson(Map<String, dynamic> json) =>
    SearchRequest(
      query: json['query'] as String,
      type: $enumDecodeNullable(_$SearchTypeEnumMap, json['type']),
      limit: (json['limit'] as num?)?.toInt(),
      cursor: json['cursor'] as String?,
    );

Map<String, dynamic> _$SearchRequestToJson(SearchRequest instance) =>
    <String, dynamic>{
      'query': instance.query,
      'type': _$SearchTypeEnumMap[instance.type],
      'limit': instance.limit,
      'cursor': instance.cursor,
    };

AddSearchHistoryRequest _$AddSearchHistoryRequestFromJson(
  Map<String, dynamic> json,
) => AddSearchHistoryRequest(
  query: json['query'] as String,
  type: $enumDecode(_$SearchTypeEnumMap, json['type']),
);

Map<String, dynamic> _$AddSearchHistoryRequestToJson(
  AddSearchHistoryRequest instance,
) => <String, dynamic>{
  'query': instance.query,
  'type': _$SearchTypeEnumMap[instance.type]!,
};
