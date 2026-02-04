import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';

part 'notification_model.g.dart';

@JsonSerializable()
class NotificationModel {
  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String? body;
  final String? imageUrl;
  final NotificationDataModel? data;
  final SimpleUserModel? actor;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? readAt;

  const NotificationModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    this.body,
    this.imageUrl,
    this.data,
    this.actor,
    this.isRead = false,
    required this.createdAt,
    this.readAt,
  });

  /// Custom fromJson to handle API field differences and unknown types
  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    // Handle notification type - API might return different values
    NotificationType type = NotificationType.system; // default fallback
    final typeValue = json['type'] as String?;
    if (typeValue != null) {
      // Map API values to enum
      switch (typeValue.toLowerCase()) {
        case 'like':
        case 'post_like':
          type = NotificationType.like;
          break;
        case 'comment':
        case 'post_comment':
          type = NotificationType.comment;
          break;
        case 'follow':
        case 'new_follower':
          type = NotificationType.follow;
          break;
        case 'follow_request':
          type = NotificationType.followRequest;
          break;
        case 'follow_accepted':
        case 'follow_accept':
          type = NotificationType.followAccepted;
          break;
        case 'mention':
        case 'post_mention':
          type = NotificationType.mention;
          break;
        case 'competition_start':
          type = NotificationType.competitionStart;
          break;
        case 'competition_end':
          type = NotificationType.competitionEnd;
          break;
        case 'competition_result':
          type = NotificationType.competitionResult;
          break;
        case 'competition_reminder':
          type = NotificationType.competitionReminder;
          break;
        case 'new_message':
        case 'message':
          type = NotificationType.newMessage;
          break;
        case 'payment':
          type = NotificationType.payment;
          break;
        case 'system':
        default:
          type = NotificationType.system;
          break;
      }
    }

    // Handle actor - API might return 'actor' or 'sender' or 'fromUser'
    SimpleUserModel? actor;
    final actorJson = json['actor'] ?? json['sender'] ?? json['fromUser'];
    if (actorJson != null && actorJson is Map<String, dynamic>) {
      actor = SimpleUserModel.fromJson(actorJson);
    }

    // Handle data object
    NotificationDataModel? data;
    if (json['data'] != null && json['data'] is Map<String, dynamic>) {
      data = NotificationDataModel.fromJson(json['data'] as Map<String, dynamic>);
    } else {
      // Build data from top-level fields if not nested
      data = NotificationDataModel(
        postId: json['postId'] as String?,
        commentId: json['commentId'] as String?,
        competitionId: json['competitionId'] as String?,
        userId: json['actorId'] as String? ?? json['senderId'] as String?,
      );
    }

    // Handle title - API might use 'title' or 'message' or generate from type
    String title = json['title'] as String? ?? 
                   json['message'] as String? ?? 
                   _generateTitleFromType(type);

    return NotificationModel(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      type: type,
      title: title,
      body: json['body'] as String? ?? json['content'] as String?,
      imageUrl: json['imageUrl'] as String? ?? json['image'] as String?,
      data: data,
      actor: actor,
      isRead: json['isRead'] as bool? ?? json['read'] as bool? ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
    );
  }

  static String _generateTitleFromType(NotificationType type) {
    switch (type) {
      case NotificationType.like:
        return 'liked your post';
      case NotificationType.comment:
        return 'commented on your post';
      case NotificationType.follow:
        return 'started following you';
      case NotificationType.followRequest:
        return 'requested to follow you';
      case NotificationType.followAccepted:
        return 'accepted your follow request';
      case NotificationType.mention:
        return 'mentioned you';
      case NotificationType.competitionStart:
        return 'Competition started';
      case NotificationType.competitionEnd:
        return 'Competition ended';
      case NotificationType.competitionResult:
        return 'Competition results';
      case NotificationType.competitionReminder:
        return 'Competition reminder';
      case NotificationType.newMessage:
        return 'sent you a message';
      case NotificationType.payment:
        return 'Payment notification';
      case NotificationType.system:
        return 'System notification';
    }
  }

  Map<String, dynamic> toJson() => _$NotificationModelToJson(this);

  NotificationModel copyWith({
    String? id,
    String? userId,
    NotificationType? type,
    String? title,
    String? body,
    String? imageUrl,
    NotificationDataModel? data,
    SimpleUserModel? actor,
    bool? isRead,
    DateTime? createdAt,
    DateTime? readAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      imageUrl: imageUrl ?? this.imageUrl,
      data: data ?? this.data,
      actor: actor ?? this.actor,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      readAt: readAt ?? this.readAt,
    );
  }
}

enum NotificationType {
  @JsonValue('like')
  like,
  @JsonValue('comment')
  comment,
  @JsonValue('follow')
  follow,
  @JsonValue('follow_request')
  followRequest,
  @JsonValue('follow_accepted')
  followAccepted,
  @JsonValue('mention')
  mention,
  @JsonValue('competition_start')
  competitionStart,
  @JsonValue('competition_end')
  competitionEnd,
  @JsonValue('competition_result')
  competitionResult,
  @JsonValue('competition_reminder')
  competitionReminder,
  @JsonValue('new_message')
  newMessage,
  @JsonValue('payment')
  payment,
  @JsonValue('system')
  system,
}

@JsonSerializable()
class NotificationDataModel {
  final String? postId;
  final String? commentId;
  final String? competitionId;
  final String? userId;

  const NotificationDataModel({
    this.postId,
    this.commentId,
    this.competitionId,
    this.userId,
  });

  factory NotificationDataModel.fromJson(Map<String, dynamic> json) =>
      _$NotificationDataModelFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationDataModelToJson(this);
}

@JsonSerializable()
class UnreadCountModel {
  final int total;
  final int likes;
  final int comments;
  final int follows;
  final int competitions;
  final int messages;
  final int system;

  const UnreadCountModel({
    this.total = 0,
    this.likes = 0,
    this.comments = 0,
    this.follows = 0,
    this.competitions = 0,
    this.messages = 0,
    this.system = 0,
  });

  factory UnreadCountModel.fromJson(Map<String, dynamic> json) =>
      _$UnreadCountModelFromJson(json);

  Map<String, dynamic> toJson() => _$UnreadCountModelToJson(this);
}

@JsonSerializable()
class DeviceTokenModel {
  final String id;
  final String userId;
  final String token;
  final String platform;
  final String? deviceId;
  final String? deviceName;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? lastUsedAt;

  const DeviceTokenModel({
    required this.id,
    required this.userId,
    required this.token,
    required this.platform,
    this.deviceId,
    this.deviceName,
    this.isActive = true,
    required this.createdAt,
    this.lastUsedAt,
  });

  factory DeviceTokenModel.fromJson(Map<String, dynamic> json) =>
      _$DeviceTokenModelFromJson(json);

  Map<String, dynamic> toJson() => _$DeviceTokenModelToJson(this);
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class RegisterDeviceRequest {
  final String token;
  final String platform;
  final String? deviceId;
  final String? deviceName;

  const RegisterDeviceRequest({
    required this.token,
    required this.platform,
    this.deviceId,
    this.deviceName,
  });

  factory RegisterDeviceRequest.fromJson(Map<String, dynamic> json) =>
      _$RegisterDeviceRequestFromJson(json);

  Map<String, dynamic> toJson() => _$RegisterDeviceRequestToJson(this);
}

@JsonSerializable()
class MarkNotificationsReadRequest {
  final List<String>? notificationIds;
  final bool markAll;

  const MarkNotificationsReadRequest({
    this.notificationIds,
    this.markAll = false,
  });

  factory MarkNotificationsReadRequest.fromJson(Map<String, dynamic> json) =>
      _$MarkNotificationsReadRequestFromJson(json);

  Map<String, dynamic> toJson() => _$MarkNotificationsReadRequestToJson(this);
}
