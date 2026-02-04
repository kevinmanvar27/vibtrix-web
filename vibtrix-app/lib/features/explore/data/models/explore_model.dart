import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../search/data/models/search_model.dart';

part 'explore_model.g.dart';

/// Main explore feed containing all discovery sections
@JsonSerializable(explicitToJson: true)
class ExploreFeedModel {
  final List<PostModel>? trendingPosts;
  final List<HashtagModel>? trendingHashtags;
  final List<SimpleUserModel>? suggestedUsers;
  final List<CompetitionModel>? activeCompetitions;
  final List<ExploreCategoryModel>? categories;
  final List<FeaturedContentModel>? featuredContent;
  final List<SimpleUserModel>? featuredCreators;

  ExploreFeedModel({
    this.trendingPosts,
    this.trendingHashtags,
    this.suggestedUsers,
    this.activeCompetitions,
    this.categories,
    this.featuredContent,
    this.featuredCreators,
  });

  factory ExploreFeedModel.fromJson(Map<String, dynamic> json) =>
      _$ExploreFeedModelFromJson(json);
  Map<String, dynamic> toJson() => _$ExploreFeedModelToJson(this);
}

/// Category for explore content
@JsonSerializable()
class ExploreCategoryModel {
  final String id;
  final String name;
  final String? slug;
  final String? icon;
  final String? imageUrl;
  final String? description;
  final int? postCount;
  final bool? isActive;

  ExploreCategoryModel({
    required this.id,
    required this.name,
    this.slug,
    this.icon,
    this.imageUrl,
    this.description,
    this.postCount,
    this.isActive,
  });

  factory ExploreCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$ExploreCategoryModelFromJson(json);
  Map<String, dynamic> toJson() => _$ExploreCategoryModelToJson(this);
}

/// Featured content item
@JsonSerializable(explicitToJson: true)
class FeaturedContentModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? videoUrl;
  @JsonKey(name: 'content_type')
  final FeaturedContentType type;
  @JsonKey(name: 'target_id')
  final String? targetId;
  @JsonKey(name: 'target_url')
  final String? targetUrl;
  final int? priority;
  @JsonKey(name: 'start_date')
  final DateTime? startDate;
  @JsonKey(name: 'end_date')
  final DateTime? endDate;
  @JsonKey(name: 'is_active')
  final bool? isActive;

  FeaturedContentModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.videoUrl,
    required this.type,
    this.targetId,
    this.targetUrl,
    this.priority,
    this.startDate,
    this.endDate,
    this.isActive,
  });

  factory FeaturedContentModel.fromJson(Map<String, dynamic> json) =>
      _$FeaturedContentModelFromJson(json);
  Map<String, dynamic> toJson() => _$FeaturedContentModelToJson(this);
}

/// Hashtag detail with statistics
@JsonSerializable(explicitToJson: true)
class HashtagDetailModel {
  final String? id;
  final String name;
  @JsonKey(name: 'post_count')
  final int postCount;
  @JsonKey(name: 'view_count')
  final int? viewCount;
  @JsonKey(name: 'is_trending')
  final bool? isTrending;
  @JsonKey(name: 'is_following')
  final bool? isFollowing;
  final String? description;
  @JsonKey(name: 'cover_image')
  final String? coverImage;
  @JsonKey(name: 'top_posts')
  final List<PostModel>? topPosts;
  @JsonKey(name: 'related_hashtags')
  final List<HashtagModel>? relatedHashtags;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  HashtagDetailModel({
    this.id,
    required this.name,
    required this.postCount,
    this.viewCount,
    this.isTrending,
    this.isFollowing,
    this.description,
    this.coverImage,
    this.topPosts,
    this.relatedHashtags,
    this.createdAt,
  });

  factory HashtagDetailModel.fromJson(Map<String, dynamic> json) =>
      _$HashtagDetailModelFromJson(json);
  Map<String, dynamic> toJson() => _$HashtagDetailModelToJson(this);
}

/// Type of featured content
enum FeaturedContentType {
  @JsonValue('post')
  post,
  @JsonValue('competition')
  competition,
  @JsonValue('user')
  user,
  @JsonValue('hashtag')
  hashtag,
  @JsonValue('banner')
  banner,
  @JsonValue('external')
  external,
}
