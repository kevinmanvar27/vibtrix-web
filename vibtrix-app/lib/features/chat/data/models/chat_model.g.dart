// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ChatModel _$ChatModelFromJson(Map<String, dynamic> json) => ChatModel(
  id: json['id'] as String,
  type: $enumDecode(_$ChatTypeEnumMap, json['type']),
  name: json['name'] as String?,
  imageUrl: json['imageUrl'] as String?,
  participants:
      (json['participants'] as List<dynamic>)
          .map((e) => ChatParticipantModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  lastMessage:
      json['lastMessage'] == null
          ? null
          : MessageModel.fromJson(json['lastMessage'] as Map<String, dynamic>),
  unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
  isMuted: json['isMuted'] as bool? ?? false,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$ChatModelToJson(ChatModel instance) => <String, dynamic>{
  'id': instance.id,
  'type': _$ChatTypeEnumMap[instance.type]!,
  'name': instance.name,
  'imageUrl': instance.imageUrl,
  'participants': instance.participants,
  'lastMessage': instance.lastMessage,
  'unreadCount': instance.unreadCount,
  'isMuted': instance.isMuted,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
};

const _$ChatTypeEnumMap = {ChatType.direct: 'direct', ChatType.group: 'group'};

ChatParticipantModel _$ChatParticipantModelFromJson(
  Map<String, dynamic> json,
) => ChatParticipantModel(
  id: json['id'] as String,
  chatId: json['chatId'] as String,
  userId: json['userId'] as String,
  user:
      json['user'] == null
          ? null
          : SimpleUserModel.fromJson(json['user'] as Map<String, dynamic>),
  role:
      $enumDecodeNullable(_$ParticipantRoleEnumMap, json['role']) ??
      ParticipantRole.member,
  joinedAt: DateTime.parse(json['joinedAt'] as String),
  lastReadAt:
      json['lastReadAt'] == null
          ? null
          : DateTime.parse(json['lastReadAt'] as String),
);

Map<String, dynamic> _$ChatParticipantModelToJson(
  ChatParticipantModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'chatId': instance.chatId,
  'userId': instance.userId,
  'user': instance.user,
  'role': _$ParticipantRoleEnumMap[instance.role]!,
  'joinedAt': instance.joinedAt?.toIso8601String(),
  'lastReadAt': instance.lastReadAt?.toIso8601String(),
};

const _$ParticipantRoleEnumMap = {
  ParticipantRole.admin: 'admin',
  ParticipantRole.member: 'member',
};

MessageModel _$MessageModelFromJson(Map<String, dynamic> json) => MessageModel(
  id: json['id'] as String,
  chatId: json['chatId'] as String,
  senderId: json['senderId'] as String,
  sender:
      json['sender'] == null
          ? null
          : SimpleUserModel.fromJson(json['sender'] as Map<String, dynamic>),
  type: $enumDecode(_$MessageTypeEnumMap, json['type']),
  content: json['content'] as String?,
  media:
      json['media'] == null
          ? null
          : MessageMediaModel.fromJson(json['media'] as Map<String, dynamic>),
  replyToId: json['replyToId'] as String?,
  replyTo:
      json['replyTo'] == null
          ? null
          : MessageModel.fromJson(json['replyTo'] as Map<String, dynamic>),
  status:
      $enumDecodeNullable(_$MessageStatusEnumMap, json['status']) ??
      MessageStatus.sent,
  createdAt: DateTime.parse(json['createdAt'] as String),
  readAt:
      json['readAt'] == null ? null : DateTime.parse(json['readAt'] as String),
  deletedAt:
      json['deletedAt'] == null
          ? null
          : DateTime.parse(json['deletedAt'] as String),
);

Map<String, dynamic> _$MessageModelToJson(MessageModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'chatId': instance.chatId,
      'senderId': instance.senderId,
      'sender': instance.sender,
      'type': _$MessageTypeEnumMap[instance.type]!,
      'content': instance.content,
      'media': instance.media,
      'replyToId': instance.replyToId,
      'replyTo': instance.replyTo,
      'status': _$MessageStatusEnumMap[instance.status]!,
      'createdAt': instance.createdAt.toIso8601String(),
      'readAt': instance.readAt?.toIso8601String(),
      'deletedAt': instance.deletedAt?.toIso8601String(),
    };

const _$MessageTypeEnumMap = {
  MessageType.text: 'text',
  MessageType.image: 'image',
  MessageType.video: 'video',
  MessageType.audio: 'audio',
  MessageType.file: 'file',
  MessageType.post: 'post',
  MessageType.competition: 'competition',
  MessageType.system: 'system',
};

const _$MessageStatusEnumMap = {
  MessageStatus.sending: 'sending',
  MessageStatus.sent: 'sent',
  MessageStatus.delivered: 'delivered',
  MessageStatus.read: 'read',
  MessageStatus.failed: 'failed',
};

MessageMediaModel _$MessageMediaModelFromJson(Map<String, dynamic> json) =>
    MessageMediaModel(
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      mimeType: json['mimeType'] as String?,
      size: (json['size'] as num?)?.toInt(),
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
      fileName: json['fileName'] as String?,
    );

Map<String, dynamic> _$MessageMediaModelToJson(MessageMediaModel instance) =>
    <String, dynamic>{
      'url': instance.url,
      'thumbnailUrl': instance.thumbnailUrl,
      'mimeType': instance.mimeType,
      'size': instance.size,
      'width': instance.width,
      'height': instance.height,
      'duration': instance.duration,
      'fileName': instance.fileName,
    };

CreateChatRequest _$CreateChatRequestFromJson(Map<String, dynamic> json) =>
    CreateChatRequest(
      participantIds:
          (json['participantIds'] as List<dynamic>)
              .map((e) => e as String)
              .toList(),
      name: json['name'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );

Map<String, dynamic> _$CreateChatRequestToJson(CreateChatRequest instance) =>
    <String, dynamic>{
      'participantIds': instance.participantIds,
      'name': instance.name,
      'imageUrl': instance.imageUrl,
    };

SendMessageRequest _$SendMessageRequestFromJson(Map<String, dynamic> json) =>
    SendMessageRequest(
      type: $enumDecode(_$MessageTypeEnumMap, json['type']),
      content: json['content'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      mimeType: json['mimeType'] as String?,
      size: (json['size'] as num?)?.toInt(),
      fileName: json['fileName'] as String?,
      replyToId: json['replyToId'] as String?,
    );

Map<String, dynamic> _$SendMessageRequestToJson(SendMessageRequest instance) =>
    <String, dynamic>{
      'type': _$MessageTypeEnumMap[instance.type]!,
      'content': instance.content,
      'mediaUrl': instance.mediaUrl,
      'thumbnailUrl': instance.thumbnailUrl,
      'mimeType': instance.mimeType,
      'size': instance.size,
      'fileName': instance.fileName,
      'replyToId': instance.replyToId,
    };

CreateGroupChatRequest _$CreateGroupChatRequestFromJson(
  Map<String, dynamic> json,
) => CreateGroupChatRequest(
  participantIds:
      (json['participantIds'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
  name: json['name'] as String,
  imageUrl: json['imageUrl'] as String?,
);

Map<String, dynamic> _$CreateGroupChatRequestToJson(
  CreateGroupChatRequest instance,
) => <String, dynamic>{
  'participantIds': instance.participantIds,
  'name': instance.name,
  'imageUrl': instance.imageUrl,
};

UpdateGroupRequest _$UpdateGroupRequestFromJson(Map<String, dynamic> json) =>
    UpdateGroupRequest(
      name: json['name'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );

Map<String, dynamic> _$UpdateGroupRequestToJson(UpdateGroupRequest instance) =>
    <String, dynamic>{'name': instance.name, 'imageUrl': instance.imageUrl};

MuteChatRequest _$MuteChatRequestFromJson(Map<String, dynamic> json) =>
    MuteChatRequest(
      durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
    );

Map<String, dynamic> _$MuteChatRequestToJson(MuteChatRequest instance) =>
    <String, dynamic>{'durationMinutes': instance.durationMinutes};

MutedStatusResponse _$MutedStatusResponseFromJson(Map<String, dynamic> json) =>
    MutedStatusResponse(
      isMuted: json['isMuted'] as bool,
      mutedUntil:
          json['mutedUntil'] == null
              ? null
              : DateTime.parse(json['mutedUntil'] as String),
    );

Map<String, dynamic> _$MutedStatusResponseToJson(
  MutedStatusResponse instance,
) => <String, dynamic>{
  'isMuted': instance.isMuted,
  'mutedUntil': instance.mutedUntil?.toIso8601String(),
};

AddReactionRequest _$AddReactionRequestFromJson(Map<String, dynamic> json) =>
    AddReactionRequest(emoji: json['emoji'] as String);

Map<String, dynamic> _$AddReactionRequestToJson(AddReactionRequest instance) =>
    <String, dynamic>{'emoji': instance.emoji};

UnreadCountResponse _$UnreadCountResponseFromJson(Map<String, dynamic> json) =>
    UnreadCountResponse(count: (json['count'] as num).toInt());

Map<String, dynamic> _$UnreadCountResponseToJson(
  UnreadCountResponse instance,
) => <String, dynamic>{'count': instance.count};

AddParticipantRequest _$AddParticipantRequestFromJson(
  Map<String, dynamic> json,
) => AddParticipantRequest(userId: json['userId'] as String);

Map<String, dynamic> _$AddParticipantRequestToJson(
  AddParticipantRequest instance,
) => <String, dynamic>{'userId': instance.userId};
