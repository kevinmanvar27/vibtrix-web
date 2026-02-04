// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationModel _$NotificationModelFromJson(Map<String, dynamic> json) =>
    NotificationModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: $enumDecode(_$NotificationTypeEnumMap, json['type']),
      title: json['title'] as String,
      body: json['body'] as String?,
      imageUrl: json['imageUrl'] as String?,
      data:
          json['data'] == null
              ? null
              : NotificationDataModel.fromJson(
                json['data'] as Map<String, dynamic>,
              ),
      actor:
          json['actor'] == null
              ? null
              : SimpleUserModel.fromJson(json['actor'] as Map<String, dynamic>),
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt:
          json['readAt'] == null
              ? null
              : DateTime.parse(json['readAt'] as String),
    );

Map<String, dynamic> _$NotificationModelToJson(NotificationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'type': _$NotificationTypeEnumMap[instance.type]!,
      'title': instance.title,
      'body': instance.body,
      'imageUrl': instance.imageUrl,
      'data': instance.data,
      'actor': instance.actor,
      'isRead': instance.isRead,
      'createdAt': instance.createdAt.toIso8601String(),
      'readAt': instance.readAt?.toIso8601String(),
    };

const _$NotificationTypeEnumMap = {
  NotificationType.like: 'like',
  NotificationType.comment: 'comment',
  NotificationType.follow: 'follow',
  NotificationType.followRequest: 'follow_request',
  NotificationType.followAccepted: 'follow_accepted',
  NotificationType.mention: 'mention',
  NotificationType.competitionStart: 'competition_start',
  NotificationType.competitionEnd: 'competition_end',
  NotificationType.competitionResult: 'competition_result',
  NotificationType.competitionReminder: 'competition_reminder',
  NotificationType.newMessage: 'new_message',
  NotificationType.payment: 'payment',
  NotificationType.system: 'system',
};

NotificationDataModel _$NotificationDataModelFromJson(
  Map<String, dynamic> json,
) => NotificationDataModel(
  postId: json['postId'] as String?,
  commentId: json['commentId'] as String?,
  competitionId: json['competitionId'] as String?,
  chatId: json['chatId'] as String?,
  userId: json['userId'] as String?,
  transactionId: json['transactionId'] as String?,
  extra: json['extra'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$NotificationDataModelToJson(
  NotificationDataModel instance,
) => <String, dynamic>{
  'postId': instance.postId,
  'commentId': instance.commentId,
  'competitionId': instance.competitionId,
  'chatId': instance.chatId,
  'userId': instance.userId,
  'transactionId': instance.transactionId,
  'extra': instance.extra,
};

UnreadCountModel _$UnreadCountModelFromJson(Map<String, dynamic> json) =>
    UnreadCountModel(
      total: (json['total'] as num?)?.toInt() ?? 0,
      likes: (json['likes'] as num?)?.toInt() ?? 0,
      comments: (json['comments'] as num?)?.toInt() ?? 0,
      follows: (json['follows'] as num?)?.toInt() ?? 0,
      competitions: (json['competitions'] as num?)?.toInt() ?? 0,
      messages: (json['messages'] as num?)?.toInt() ?? 0,
      system: (json['system'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$UnreadCountModelToJson(UnreadCountModel instance) =>
    <String, dynamic>{
      'total': instance.total,
      'likes': instance.likes,
      'comments': instance.comments,
      'follows': instance.follows,
      'competitions': instance.competitions,
      'messages': instance.messages,
      'system': instance.system,
    };

DeviceTokenModel _$DeviceTokenModelFromJson(Map<String, dynamic> json) =>
    DeviceTokenModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      token: json['token'] as String,
      platform: json['platform'] as String,
      deviceId: json['deviceId'] as String?,
      deviceName: json['deviceName'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
      lastUsedAt:
          json['lastUsedAt'] == null
              ? null
              : DateTime.parse(json['lastUsedAt'] as String),
    );

Map<String, dynamic> _$DeviceTokenModelToJson(DeviceTokenModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'token': instance.token,
      'platform': instance.platform,
      'deviceId': instance.deviceId,
      'deviceName': instance.deviceName,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
      'lastUsedAt': instance.lastUsedAt?.toIso8601String(),
    };

RegisterDeviceRequest _$RegisterDeviceRequestFromJson(
  Map<String, dynamic> json,
) => RegisterDeviceRequest(
  token: json['token'] as String,
  platform: json['platform'] as String,
  deviceId: json['deviceId'] as String?,
  deviceName: json['deviceName'] as String?,
);

Map<String, dynamic> _$RegisterDeviceRequestToJson(
  RegisterDeviceRequest instance,
) => <String, dynamic>{
  'token': instance.token,
  'platform': instance.platform,
  'deviceId': instance.deviceId,
  'deviceName': instance.deviceName,
};

MarkNotificationsReadRequest _$MarkNotificationsReadRequestFromJson(
  Map<String, dynamic> json,
) => MarkNotificationsReadRequest(
  notificationIds:
      (json['notificationIds'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
  markAll: json['markAll'] as bool? ?? false,
);

Map<String, dynamic> _$MarkNotificationsReadRequestToJson(
  MarkNotificationsReadRequest instance,
) => <String, dynamic>{
  'notificationIds': instance.notificationIds,
  'markAll': instance.markAll,
};
