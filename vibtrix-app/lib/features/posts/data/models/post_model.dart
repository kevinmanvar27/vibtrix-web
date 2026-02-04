import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';

part 'post_model.g.dart';

/// Custom JSON converter for PostModel that handles API response mapping
/// API returns: attachments[], _count.likes, likes[], bookmarks[]
/// App expects: media, likesCount, isLiked, isBookmarked
@JsonSerializable()
class PostModel {
  final String id;
  final String userId;
  final SimpleUserModel? user;
  @JsonKey(name: 'content')
  final String? caption;
  final PostMediaModel? media;
  @JsonKey(defaultValue: 0)
  final int likesCount;
  @JsonKey(defaultValue: 0)
  final int commentsCount;
  @JsonKey(defaultValue: 0)
  final int sharesCount;
  @JsonKey(defaultValue: 0)
  final int viewsCount;
  @JsonKey(defaultValue: false)
  final bool isLiked;
  @JsonKey(defaultValue: false)
  final bool isBookmarked;
  final String? competitionId;
  final CompetitionInfoModel? competition;
  final List<String>? hashtags;
  final List<String>? mentions;
  final PostLocationModel? location;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const PostModel({
    required this.id,
    required this.userId,
    this.user,
    this.caption,
    this.media,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.viewsCount = 0,
    this.isLiked = false,
    this.isBookmarked = false,
    this.competitionId,
    this.competition,
    this.hashtags,
    this.mentions,
    this.location,
    required this.createdAt,
    this.updatedAt,
  });

  /// Custom fromJson that handles API response format differences
  factory PostModel.fromJson(Map<String, dynamic> json) {
    // Handle media: API returns 'attachments' array, we need 'media' object
    PostMediaModel? media;
    if (json['media'] != null) {
      // If media is already provided (expected format)
      media = PostMediaModel.fromJson(json['media'] as Map<String, dynamic>);
    } else if (json['attachments'] != null) {
      // API format: convert first attachment to media
      final attachments = json['attachments'] as List<dynamic>?;
      if (attachments != null && attachments.isNotEmpty) {
        final firstAttachment = attachments[0] as Map<String, dynamic>;
        media = PostMediaModel.fromApiAttachment(firstAttachment);
      }
    }

    // Handle counts: API returns '_count' object
    int likesCount = 0;
    int commentsCount = 0;
    if (json['_count'] != null) {
      final count = json['_count'] as Map<String, dynamic>;
      likesCount = (count['likes'] as num?)?.toInt() ?? 0;
      commentsCount = (count['comments'] as num?)?.toInt() ?? 0;
    } else {
      likesCount = (json['likesCount'] as num?)?.toInt() ?? 0;
      commentsCount = (json['commentsCount'] as num?)?.toInt() ?? 0;
    }

    // Handle isLiked: API returns 'likes' array (non-empty means liked)
    bool isLiked = false;
    if (json['isLiked'] != null) {
      isLiked = json['isLiked'] as bool;
    } else if (json['likes'] != null) {
      final likes = json['likes'] as List<dynamic>?;
      isLiked = likes != null && likes.isNotEmpty;
    }

    // Handle isBookmarked: API returns 'bookmarks' array (non-empty means bookmarked)
    bool isBookmarked = false;
    if (json['isBookmarked'] != null) {
      isBookmarked = json['isBookmarked'] as bool;
    } else if (json['bookmarks'] != null) {
      final bookmarks = json['bookmarks'] as List<dynamic>?;
      isBookmarked = bookmarks != null && bookmarks.isNotEmpty;
    }

    // Handle user
    SimpleUserModel? user;
    if (json['user'] != null) {
      user = SimpleUserModel.fromJson(json['user'] as Map<String, dynamic>);
    }

    // Handle caption: API uses 'content', app uses 'caption'
    final caption = json['caption'] as String? ?? json['content'] as String?;

    return PostModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      user: user,
      caption: caption,
      media: media,
      likesCount: likesCount,
      commentsCount: commentsCount,
      sharesCount: (json['sharesCount'] as num?)?.toInt() ?? 0,
      viewsCount: (json['viewsCount'] as num?)?.toInt() ?? 0,
      isLiked: isLiked,
      isBookmarked: isBookmarked,
      competitionId: json['competitionId'] as String?,
      competition: json['competition'] == null
          ? null
          : CompetitionInfoModel.fromJson(json['competition'] as Map<String, dynamic>),
      hashtags: (json['hashtags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      mentions: (json['mentions'] as List<dynamic>?)?.map((e) => e as String).toList(),
      location: json['location'] == null
          ? null
          : PostLocationModel.fromJson(json['location'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => _$PostModelToJson(this);

  PostModel copyWith({
    String? id,
    String? userId,
    SimpleUserModel? user,
    String? caption,
    PostMediaModel? media,
    int? likesCount,
    int? commentsCount,
    int? sharesCount,
    int? viewsCount,
    bool? isLiked,
    bool? isBookmarked,
    String? competitionId,
    CompetitionInfoModel? competition,
    List<String>? hashtags,
    List<String>? mentions,
    PostLocationModel? location,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PostModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      user: user ?? this.user,
      caption: caption ?? this.caption,
      media: media ?? this.media,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      sharesCount: sharesCount ?? this.sharesCount,
      viewsCount: viewsCount ?? this.viewsCount,
      isLiked: isLiked ?? this.isLiked,
      isBookmarked: isBookmarked ?? this.isBookmarked,
      competitionId: competitionId ?? this.competitionId,
      competition: competition ?? this.competition,
      hashtags: hashtags ?? this.hashtags,
      mentions: mentions ?? this.mentions,
      location: location ?? this.location,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

@JsonSerializable()
class PostMediaModel {
  final String type; // 'video' or 'image'
  final String url;
  final String? thumbnailUrl;
  final int? width;
  final int? height;
  final int? duration; // in seconds for videos
  final List<StickerModel>? stickers;

  const PostMediaModel({
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.width,
    this.height,
    this.duration,
    this.stickers,
  });

  factory PostMediaModel.fromJson(Map<String, dynamic> json) =>
      _$PostMediaModelFromJson(json);

  /// Create from API attachment format
  factory PostMediaModel.fromApiAttachment(Map<String, dynamic> json) {
    // API returns type as 'VIDEO' or 'IMAGE', app expects 'video' or 'image'
    String type = (json['type'] as String? ?? 'image').toLowerCase();
    
    return PostMediaModel(
      type: type,
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
      stickers: null, // Stickers are handled separately in API
    );
  }

  Map<String, dynamic> toJson() => _$PostMediaModelToJson(this);

  bool get isVideo => type.toLowerCase() == 'video';
  bool get isImage => type.toLowerCase() == 'image';
}

@JsonSerializable()
class StickerModel {
  final String id;
  final String imageUrl;
  final double x;
  final double y;
  final double scale;
  final double rotation;

  const StickerModel({
    required this.id,
    required this.imageUrl,
    required this.x,
    required this.y,
    this.scale = 1.0,
    this.rotation = 0.0,
  });

  factory StickerModel.fromJson(Map<String, dynamic> json) =>
      _$StickerModelFromJson(json);

  Map<String, dynamic> toJson() => _$StickerModelToJson(this);
}

@JsonSerializable()
class PostLocationModel {
  final String? name;
  final double? latitude;
  final double? longitude;

  const PostLocationModel({
    this.name,
    this.latitude,
    this.longitude,
  });

  factory PostLocationModel.fromJson(Map<String, dynamic> json) =>
      _$PostLocationModelFromJson(json);

  Map<String, dynamic> toJson() => _$PostLocationModelToJson(this);
}

@JsonSerializable()
class CompetitionInfoModel {
  final String id;
  final String name;
  final String? thumbnailUrl;
  final int? rank;
  final int? votes;

  const CompetitionInfoModel({
    required this.id,
    required this.name,
    this.thumbnailUrl,
    this.rank,
    this.votes,
  });

  factory CompetitionInfoModel.fromJson(Map<String, dynamic> json) =>
      _$CompetitionInfoModelFromJson(json);

  Map<String, dynamic> toJson() => _$CompetitionInfoModelToJson(this);
}

@JsonSerializable()
class CommentModel {
  final String id;
  final String postId;
  final String userId;
  final SimpleUserModel? user;
  final String content;
  final int likesCount;
  final bool isLiked;
  final String? parentId;
  final int repliesCount;
  final DateTime createdAt;

  const CommentModel({
    required this.id,
    required this.postId,
    required this.userId,
    this.user,
    required this.content,
    this.likesCount = 0,
    this.isLiked = false,
    this.parentId,
    this.repliesCount = 0,
    required this.createdAt,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) =>
      _$CommentModelFromJson(json);

  Map<String, dynamic> toJson() => _$CommentModelToJson(this);

  CommentModel copyWith({
    String? id,
    String? postId,
    String? userId,
    SimpleUserModel? user,
    String? content,
    int? likesCount,
    bool? isLiked,
    String? parentId,
    int? repliesCount,
    DateTime? createdAt,
  }) {
    return CommentModel(
      id: id ?? this.id,
      postId: postId ?? this.postId,
      userId: userId ?? this.userId,
      user: user ?? this.user,
      content: content ?? this.content,
      likesCount: likesCount ?? this.likesCount,
      isLiked: isLiked ?? this.isLiked,
      parentId: parentId ?? this.parentId,
      repliesCount: repliesCount ?? this.repliesCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

// ============ REQUEST MODELS ============

/// Request model for creating a post
/// Backend expects: { content: string, mediaIds: string[] }
@JsonSerializable()
class CreatePostRequest {
  /// The post content/caption
  final String content;
  
  /// Array of media IDs (from upload endpoint)
  final List<String> mediaIds;

  const CreatePostRequest({
    this.content = '',
    this.mediaIds = const [],
  });

  factory CreatePostRequest.fromJson(Map<String, dynamic> json) =>
      _$CreatePostRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreatePostRequestToJson(this);
}

@JsonSerializable()
class UpdatePostRequest {
  final String? caption;
  final PostLocationModel? location;

  const UpdatePostRequest({
    this.caption,
    this.location,
  });

  factory UpdatePostRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdatePostRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdatePostRequestToJson(this);
}

@JsonSerializable()
class AddCommentRequest {
  final String content;
  final String? parentId;

  const AddCommentRequest({
    required this.content,
    this.parentId,
  });

  factory AddCommentRequest.fromJson(Map<String, dynamic> json) =>
      _$AddCommentRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AddCommentRequestToJson(this);
}

@JsonSerializable()
class ReportPostRequest {
  final String reason;
  final String? description;

  const ReportPostRequest({
    required this.reason,
    this.description,
  });

  factory ReportPostRequest.fromJson(Map<String, dynamic> json) =>
      _$ReportPostRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ReportPostRequestToJson(this);
}
