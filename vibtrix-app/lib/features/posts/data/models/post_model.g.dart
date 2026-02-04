// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PostModel _$PostModelFromJson(Map<String, dynamic> json) => PostModel(
  id: json['id'] as String,
  userId: json['userId'] as String,
  user:
      json['user'] == null
          ? null
          : SimpleUserModel.fromJson(json['user'] as Map<String, dynamic>),
  caption: json['content'] as String?,
  media:
      json['media'] == null
          ? null
          : PostMediaModel.fromJson(json['media'] as Map<String, dynamic>),
  likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
  commentsCount: (json['commentsCount'] as num?)?.toInt() ?? 0,
  sharesCount: (json['sharesCount'] as num?)?.toInt() ?? 0,
  viewsCount: (json['viewsCount'] as num?)?.toInt() ?? 0,
  isLiked: json['isLiked'] as bool? ?? false,
  isBookmarked: json['isBookmarked'] as bool? ?? false,
  competitionId: json['competitionId'] as String?,
  competition:
      json['competition'] == null
          ? null
          : CompetitionInfoModel.fromJson(
            json['competition'] as Map<String, dynamic>,
          ),
  hashtags:
      (json['hashtags'] as List<dynamic>?)?.map((e) => e as String).toList(),
  mentions:
      (json['mentions'] as List<dynamic>?)?.map((e) => e as String).toList(),
  location:
      json['location'] == null
          ? null
          : PostLocationModel.fromJson(
            json['location'] as Map<String, dynamic>,
          ),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$PostModelToJson(PostModel instance) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'user': instance.user,
  'content': instance.caption,
  'media': instance.media,
  'likesCount': instance.likesCount,
  'commentsCount': instance.commentsCount,
  'sharesCount': instance.sharesCount,
  'viewsCount': instance.viewsCount,
  'isLiked': instance.isLiked,
  'isBookmarked': instance.isBookmarked,
  'competitionId': instance.competitionId,
  'competition': instance.competition,
  'hashtags': instance.hashtags,
  'mentions': instance.mentions,
  'location': instance.location,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};

PostMediaModel _$PostMediaModelFromJson(Map<String, dynamic> json) =>
    PostMediaModel(
      type: json['type'] as String,
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
      stickers:
          (json['stickers'] as List<dynamic>?)
              ?.map((e) => StickerModel.fromJson(e as Map<String, dynamic>))
              .toList(),
    );

Map<String, dynamic> _$PostMediaModelToJson(PostMediaModel instance) =>
    <String, dynamic>{
      'type': instance.type,
      'url': instance.url,
      'thumbnailUrl': instance.thumbnailUrl,
      'width': instance.width,
      'height': instance.height,
      'duration': instance.duration,
      'stickers': instance.stickers,
    };

StickerModel _$StickerModelFromJson(Map<String, dynamic> json) => StickerModel(
  id: json['id'] as String,
  imageUrl: json['imageUrl'] as String,
  x: (json['x'] as num).toDouble(),
  y: (json['y'] as num).toDouble(),
  scale: (json['scale'] as num?)?.toDouble() ?? 1.0,
  rotation: (json['rotation'] as num?)?.toDouble() ?? 0.0,
);

Map<String, dynamic> _$StickerModelToJson(StickerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'imageUrl': instance.imageUrl,
      'x': instance.x,
      'y': instance.y,
      'scale': instance.scale,
      'rotation': instance.rotation,
    };

PostLocationModel _$PostLocationModelFromJson(Map<String, dynamic> json) =>
    PostLocationModel(
      name: json['name'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$PostLocationModelToJson(PostLocationModel instance) =>
    <String, dynamic>{
      'name': instance.name,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
    };

CompetitionInfoModel _$CompetitionInfoModelFromJson(
  Map<String, dynamic> json,
) => CompetitionInfoModel(
  id: json['id'] as String,
  name: json['name'] as String,
  thumbnailUrl: json['thumbnailUrl'] as String?,
  rank: (json['rank'] as num?)?.toInt(),
  votes: (json['votes'] as num?)?.toInt(),
);

Map<String, dynamic> _$CompetitionInfoModelToJson(
  CompetitionInfoModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'thumbnailUrl': instance.thumbnailUrl,
  'rank': instance.rank,
  'votes': instance.votes,
};

CommentModel _$CommentModelFromJson(Map<String, dynamic> json) => CommentModel(
  id: json['id'] as String,
  postId: json['postId'] as String,
  userId: json['userId'] as String,
  user:
      json['user'] == null
          ? null
          : SimpleUserModel.fromJson(json['user'] as Map<String, dynamic>),
  content: json['content'] as String,
  likesCount: (json['likesCount'] as num?)?.toInt() ?? 0,
  isLiked: json['isLiked'] as bool? ?? false,
  parentId: json['parentId'] as String?,
  repliesCount: (json['repliesCount'] as num?)?.toInt() ?? 0,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$CommentModelToJson(CommentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'postId': instance.postId,
      'userId': instance.userId,
      'user': instance.user,
      'content': instance.content,
      'likesCount': instance.likesCount,
      'isLiked': instance.isLiked,
      'parentId': instance.parentId,
      'repliesCount': instance.repliesCount,
      'createdAt': instance.createdAt.toIso8601String(),
    };

CreatePostRequest _$CreatePostRequestFromJson(Map<String, dynamic> json) =>
    CreatePostRequest(
      content: json['content'] as String? ?? '',
      mediaIds:
          (json['mediaIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ?? const [],
    );

Map<String, dynamic> _$CreatePostRequestToJson(CreatePostRequest instance) =>
    <String, dynamic>{
      'content': instance.content,
      'mediaIds': instance.mediaIds,
    };

UpdatePostRequest _$UpdatePostRequestFromJson(Map<String, dynamic> json) =>
    UpdatePostRequest(
      caption: json['caption'] as String?,
      location:
          json['location'] == null
              ? null
              : PostLocationModel.fromJson(
                json['location'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$UpdatePostRequestToJson(UpdatePostRequest instance) =>
    <String, dynamic>{
      'caption': instance.caption,
      'location': instance.location,
    };

AddCommentRequest _$AddCommentRequestFromJson(Map<String, dynamic> json) =>
    AddCommentRequest(
      content: json['content'] as String,
      parentId: json['parentId'] as String?,
    );

Map<String, dynamic> _$AddCommentRequestToJson(AddCommentRequest instance) =>
    <String, dynamic>{
      'content': instance.content,
      'parentId': instance.parentId,
    };

ReportPostRequest _$ReportPostRequestFromJson(Map<String, dynamic> json) =>
    ReportPostRequest(
      reason: json['reason'] as String,
      description: json['description'] as String?,
    );

Map<String, dynamic> _$ReportPostRequestToJson(ReportPostRequest instance) =>
    <String, dynamic>{
      'reason': instance.reason,
      'description': instance.description,
    };
