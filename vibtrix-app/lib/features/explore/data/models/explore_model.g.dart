// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'explore_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ExploreFeedModel _$ExploreFeedModelFromJson(
  Map<String, dynamic> json,
) => ExploreFeedModel(
  trendingPosts:
      (json['trendingPosts'] as List<dynamic>?)
          ?.map((e) => PostModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  trendingHashtags:
      (json['trendingHashtags'] as List<dynamic>?)
          ?.map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  suggestedUsers:
      (json['suggestedUsers'] as List<dynamic>?)
          ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  activeCompetitions:
      (json['activeCompetitions'] as List<dynamic>?)
          ?.map((e) => CompetitionModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  categories:
      (json['categories'] as List<dynamic>?)
          ?.map((e) => ExploreCategoryModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  featuredContent:
      (json['featuredContent'] as List<dynamic>?)
          ?.map((e) => FeaturedContentModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  featuredCreators:
      (json['featuredCreators'] as List<dynamic>?)
          ?.map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
);

Map<String, dynamic> _$ExploreFeedModelToJson(
  ExploreFeedModel instance,
) => <String, dynamic>{
  'trendingPosts': instance.trendingPosts?.map((e) => e.toJson()).toList(),
  'trendingHashtags':
      instance.trendingHashtags?.map((e) => e.toJson()).toList(),
  'suggestedUsers': instance.suggestedUsers?.map((e) => e.toJson()).toList(),
  'activeCompetitions':
      instance.activeCompetitions?.map((e) => e.toJson()).toList(),
  'categories': instance.categories?.map((e) => e.toJson()).toList(),
  'featuredContent': instance.featuredContent?.map((e) => e.toJson()).toList(),
  'featuredCreators':
      instance.featuredCreators?.map((e) => e.toJson()).toList(),
};

ExploreCategoryModel _$ExploreCategoryModelFromJson(
  Map<String, dynamic> json,
) => ExploreCategoryModel(
  id: json['id'] as String,
  name: json['name'] as String,
  slug: json['slug'] as String?,
  icon: json['icon'] as String?,
  imageUrl: json['imageUrl'] as String?,
  description: json['description'] as String?,
  postCount: (json['postCount'] as num?)?.toInt(),
  isActive: json['isActive'] as bool?,
);

Map<String, dynamic> _$ExploreCategoryModelToJson(
  ExploreCategoryModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'slug': instance.slug,
  'icon': instance.icon,
  'imageUrl': instance.imageUrl,
  'description': instance.description,
  'postCount': instance.postCount,
  'isActive': instance.isActive,
};

FeaturedContentModel _$FeaturedContentModelFromJson(
  Map<String, dynamic> json,
) => FeaturedContentModel(
  id: json['id'] as String,
  title: json['title'] as String,
  subtitle: json['subtitle'] as String?,
  imageUrl: json['imageUrl'] as String?,
  videoUrl: json['videoUrl'] as String?,
  type: $enumDecode(_$FeaturedContentTypeEnumMap, json['content_type']),
  targetId: json['target_id'] as String?,
  targetUrl: json['target_url'] as String?,
  priority: (json['priority'] as num?)?.toInt(),
  startDate:
      json['start_date'] == null
          ? null
          : DateTime.parse(json['start_date'] as String),
  endDate:
      json['end_date'] == null
          ? null
          : DateTime.parse(json['end_date'] as String),
  isActive: json['is_active'] as bool?,
);

Map<String, dynamic> _$FeaturedContentModelToJson(
  FeaturedContentModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'subtitle': instance.subtitle,
  'imageUrl': instance.imageUrl,
  'videoUrl': instance.videoUrl,
  'content_type': _$FeaturedContentTypeEnumMap[instance.type]!,
  'target_id': instance.targetId,
  'target_url': instance.targetUrl,
  'priority': instance.priority,
  'start_date': instance.startDate?.toIso8601String(),
  'end_date': instance.endDate?.toIso8601String(),
  'is_active': instance.isActive,
};

const _$FeaturedContentTypeEnumMap = {
  FeaturedContentType.post: 'post',
  FeaturedContentType.competition: 'competition',
  FeaturedContentType.user: 'user',
  FeaturedContentType.hashtag: 'hashtag',
  FeaturedContentType.banner: 'banner',
  FeaturedContentType.external: 'external',
};

HashtagDetailModel _$HashtagDetailModelFromJson(Map<String, dynamic> json) =>
    HashtagDetailModel(
      id: json['id'] as String?,
      name: json['name'] as String,
      postCount: (json['post_count'] as num?)?.toInt() ?? 0,
      viewCount: (json['view_count'] as num?)?.toInt(),
      isTrending: json['is_trending'] as bool?,
      isFollowing: json['is_following'] as bool?,
      description: json['description'] as String?,
      coverImage: json['cover_image'] as String?,
      topPosts:
          (json['top_posts'] as List<dynamic>?)
              ?.map((e) => PostModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      relatedHashtags:
          (json['related_hashtags'] as List<dynamic>?)
              ?.map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
              .toList(),
      createdAt:
          json['created_at'] == null
              ? null
              : DateTime.parse(json['created_at'] as String),
    );

Map<String, dynamic> _$HashtagDetailModelToJson(
  HashtagDetailModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'post_count': instance.postCount,
  'view_count': instance.viewCount,
  'is_trending': instance.isTrending,
  'is_following': instance.isFollowing,
  'description': instance.description,
  'cover_image': instance.coverImage,
  'top_posts': instance.topPosts?.map((e) => e.toJson()).toList(),
  'related_hashtags': instance.relatedHashtags?.map((e) => e.toJson()).toList(),
  'created_at': instance.createdAt?.toIso8601String(),
};
