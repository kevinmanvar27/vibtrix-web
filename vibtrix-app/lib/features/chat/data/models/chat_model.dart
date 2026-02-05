import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';

part 'chat_model.g.dart';

@JsonSerializable()
class ChatModel {
  final String id;
  final ChatType type;
  final String? name;
  final String? imageUrl;
  final List<ChatParticipantModel> participants;
  final MessageModel? lastMessage;
  final int unreadCount;
  final bool isMuted;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const ChatModel({
    required this.id,
    required this.type,
    this.name,
    this.imageUrl,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
    this.isMuted = false,
    required this.createdAt,
    this.updatedAt,
  });

  /// Custom fromJson that handles API response format
  /// API returns: isGroupChat (boolean), lastMessageAt, participants with user object
  factory ChatModel.fromJson(Map<String, dynamic> json) {
    // Handle type: API returns 'isGroupChat' boolean, we need 'type' enum
    ChatType type;
    if (json['type'] != null) {
      type = ChatType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => ChatType.direct,
      );
    } else if (json['isGroupChat'] != null) {
      type = (json['isGroupChat'] as bool) ? ChatType.group : ChatType.direct;
    } else {
      type = ChatType.direct;
    }

    // Parse participants
    List<ChatParticipantModel> participants = [];
    if (json['participants'] != null) {
      participants = (json['participants'] as List<dynamic>)
          .map((p) => ChatParticipantModel.fromJson(p as Map<String, dynamic>))
          .toList();
    }

    // Parse last message
    MessageModel? lastMessage;
    if (json['lastMessage'] != null) {
      lastMessage = MessageModel.fromJson(json['lastMessage'] as Map<String, dynamic>);
    }

    // Calculate unread count from participants
    int unreadCount = 0;
    if (json['unreadCount'] != null) {
      unreadCount = (json['unreadCount'] as num).toInt();
    } else {
      // Count participants with hasUnread = true
      for (final p in participants) {
        if (p.hasUnread) unreadCount++;
      }
    }

    return ChatModel(
      id: json['id'] as String,
      type: type,
      name: json['name'] as String?,
      imageUrl: json['imageUrl'] as String? ?? json['image'] as String?,
      participants: participants,
      lastMessage: lastMessage,
      unreadCount: unreadCount,
      isMuted: json['isMuted'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'] as String) 
          : (json['lastMessageAt'] != null 
              ? DateTime.parse(json['lastMessageAt'] as String) 
              : null),
    );
  }

  Map<String, dynamic> toJson() => _$ChatModelToJson(this);

  /// Get the other participant in a direct chat
  ChatParticipantModel? getOtherParticipant(String currentUserId) {
    if (type != ChatType.direct) return null;
    return participants.firstWhere(
      (p) => p.userId != currentUserId,
      orElse: () => participants.first,
    );
  }

  /// Get display name for the chat
  String getDisplayName(String currentUserId) {
    if (type == ChatType.group) {
      return name ?? 'Group Chat';
    }
    final other = getOtherParticipant(currentUserId);
    return other?.user?.name ?? other?.user?.username ?? 'Unknown';
  }

  /// Get display image for the chat
  String? getDisplayImage(String currentUserId) {
    if (type == ChatType.group) {
      return imageUrl;
    }
    final other = getOtherParticipant(currentUserId);
    return other?.user?.profilePicture;
  }

  /// Create a copy of this ChatModel with the given fields replaced
  ChatModel copyWith({
    String? id,
    ChatType? type,
    String? name,
    String? imageUrl,
    List<ChatParticipantModel>? participants,
    MessageModel? lastMessage,
    int? unreadCount,
    bool? isMuted,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ChatModel(
      id: id ?? this.id,
      type: type ?? this.type,
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      isMuted: isMuted ?? this.isMuted,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum ChatType {
  @JsonValue('direct')
  direct,
  @JsonValue('group')
  group,
}

@JsonSerializable()
class ChatParticipantModel {
  final String id;
  final String chatId;
  final String userId;
  final SimpleUserModel? user;
  final ParticipantRole role;
  final bool hasUnread;
  final DateTime? joinedAt;
  final DateTime? lastReadAt;

  const ChatParticipantModel({
    required this.id,
    required this.chatId,
    required this.userId,
    this.user,
    this.role = ParticipantRole.member,
    this.hasUnread = false,
    this.joinedAt,
    this.lastReadAt,
  });

  /// Custom fromJson that handles API response format
  factory ChatParticipantModel.fromJson(Map<String, dynamic> json) {
    // Parse user
    SimpleUserModel? user;
    if (json['user'] != null) {
      user = SimpleUserModel.fromJson(json['user'] as Map<String, dynamic>);
    }

    // Parse role
    ParticipantRole role = ParticipantRole.member;
    if (json['role'] != null) {
      final roleStr = json['role'] as String;
      role = ParticipantRole.values.firstWhere(
        (e) => e.name == roleStr.toLowerCase(),
        orElse: () => ParticipantRole.member,
      );
    }

    return ChatParticipantModel(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      userId: json['userId'] as String,
      user: user,
      role: role,
      hasUnread: json['hasUnread'] as bool? ?? false,
      joinedAt: json['joinedAt'] != null 
          ? DateTime.parse(json['joinedAt'] as String)
          : (json['createdAt'] != null 
              ? DateTime.parse(json['createdAt'] as String) 
              : null),
      lastReadAt: json['lastReadAt'] != null 
          ? DateTime.parse(json['lastReadAt'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() => _$ChatParticipantModelToJson(this);
}

enum ParticipantRole {
  @JsonValue('admin')
  admin,
  @JsonValue('member')
  member,
}

@JsonSerializable()
class MessageModel {
  final String id;
  final String chatId;
  final String senderId;
  final SimpleUserModel? sender;
  final MessageType type;
  final String? content;
  final MessageMediaModel? media;
  final String? replyToId;
  final MessageModel? replyTo;
  final MessageStatus status;
  final DateTime createdAt;
  final DateTime? readAt;
  final DateTime? deletedAt;

  const MessageModel({
    required this.id,
    required this.chatId,
    required this.senderId,
    this.sender,
    required this.type,
    this.content,
    this.media,
    this.replyToId,
    this.replyTo,
    this.status = MessageStatus.sent,
    required this.createdAt,
    this.readAt,
    this.deletedAt,
  });

  /// Custom fromJson that handles API response format
  factory MessageModel.fromJson(Map<String, dynamic> json) {
    // Parse sender
    SimpleUserModel? sender;
    if (json['sender'] != null) {
      sender = SimpleUserModel.fromJson(json['sender'] as Map<String, dynamic>);
    }

    // Parse type - default to text if not provided
    MessageType type = MessageType.text;
    if (json['type'] != null) {
      final typeStr = (json['type'] as String).toLowerCase();
      type = MessageType.values.firstWhere(
        (e) => e.name == typeStr,
        orElse: () => MessageType.text,
      );
    }

    // Parse status
    MessageStatus status = MessageStatus.sent;
    if (json['status'] != null) {
      final statusStr = (json['status'] as String).toLowerCase();
      status = MessageStatus.values.firstWhere(
        (e) => e.name == statusStr,
        orElse: () => MessageStatus.sent,
      );
    } else if (json['isRead'] == true) {
      status = MessageStatus.read;
    }

    // Parse media
    MessageMediaModel? media;
    if (json['media'] != null) {
      media = MessageMediaModel.fromJson(json['media'] as Map<String, dynamic>);
    } else if (json['mediaUrl'] != null) {
      media = MessageMediaModel(url: json['mediaUrl'] as String);
    }

    return MessageModel(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      senderId: json['senderId'] as String,
      sender: sender,
      type: type,
      content: json['content'] as String?,
      media: media,
      replyToId: json['replyToId'] as String?,
      replyTo: json['replyTo'] != null 
          ? MessageModel.fromJson(json['replyTo'] as Map<String, dynamic>) 
          : null,
      status: status,
      createdAt: DateTime.parse(json['createdAt'] as String),
      readAt: json['readAt'] != null 
          ? DateTime.parse(json['readAt'] as String) 
          : null,
      deletedAt: json['deletedAt'] != null 
          ? DateTime.parse(json['deletedAt'] as String) 
          : null,
    );
  }

  Map<String, dynamic> toJson() => _$MessageModelToJson(this);

  bool get isDeleted => deletedAt != null;
  
  /// Whether the message has been read
  bool get isRead => status == MessageStatus.read || readAt != null;
  
  /// Get media URL (convenience getter for media.url)
  String? get mediaUrl => media?.url;
}

enum MessageType {
  @JsonValue('text')
  text,
  @JsonValue('TEXT')
  textUpper,
  @JsonValue('image')
  image,
  @JsonValue('IMAGE')
  imageUpper,
  @JsonValue('video')
  video,
  @JsonValue('VIDEO')
  videoUpper,
  @JsonValue('audio')
  audio,
  @JsonValue('AUDIO')
  audioUpper,
  @JsonValue('file')
  file,
  @JsonValue('FILE')
  fileUpper,
  @JsonValue('post')
  post,
  @JsonValue('competition')
  competition,
  @JsonValue('system')
  system,
}

enum MessageStatus {
  @JsonValue('sending')
  sending,
  @JsonValue('sent')
  sent,
  @JsonValue('delivered')
  delivered,
  @JsonValue('read')
  read,
  @JsonValue('failed')
  failed,
}

@JsonSerializable()
class MessageMediaModel {
  final String url;
  final String? thumbnailUrl;
  final String? mimeType;
  final int? size;
  final int? width;
  final int? height;
  final int? duration;
  final String? fileName;

  const MessageMediaModel({
    required this.url,
    this.thumbnailUrl,
    this.mimeType,
    this.size,
    this.width,
    this.height,
    this.duration,
    this.fileName,
  });

  factory MessageMediaModel.fromJson(Map<String, dynamic> json) =>
      _$MessageMediaModelFromJson(json);

  Map<String, dynamic> toJson() => _$MessageMediaModelToJson(this);
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class CreateChatRequest {
  final List<String> participantIds;
  final String? name;
  final String? imageUrl;

  const CreateChatRequest({
    required this.participantIds,
    this.name,
    this.imageUrl,
  });

  factory CreateChatRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateChatRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateChatRequestToJson(this);
}

@JsonSerializable()
class SendMessageRequest {
  final MessageType type;
  final String? content;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final String? mimeType;
  final int? size;
  final String? fileName;
  final String? replyToId;

  const SendMessageRequest({
    this.type = MessageType.text,
    this.content,
    this.mediaUrl,
    this.thumbnailUrl,
    this.mimeType,
    this.size,
    this.fileName,
    this.replyToId,
  });

  factory SendMessageRequest.fromJson(Map<String, dynamic> json) =>
      _$SendMessageRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SendMessageRequestToJson(this);
}

@JsonSerializable()
class CreateGroupChatRequest {
  final List<String> participantIds;
  final String name;
  final String? imageUrl;

  const CreateGroupChatRequest({
    required this.participantIds,
    required this.name,
    this.imageUrl,
  });

  factory CreateGroupChatRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateGroupChatRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateGroupChatRequestToJson(this);
}

@JsonSerializable()
class UpdateGroupRequest {
  final String? name;
  final String? imageUrl;

  const UpdateGroupRequest({
    this.name,
    this.imageUrl,
  });

  factory UpdateGroupRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateGroupRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateGroupRequestToJson(this);
}

@JsonSerializable()
class MuteChatRequest {
  final int? durationMinutes;

  const MuteChatRequest({
    this.durationMinutes,
  });

  factory MuteChatRequest.fromJson(Map<String, dynamic> json) =>
      _$MuteChatRequestFromJson(json);

  Map<String, dynamic> toJson() => _$MuteChatRequestToJson(this);
}

@JsonSerializable()
class MutedStatusResponse {
  final bool isMuted;
  final DateTime? mutedUntil;

  const MutedStatusResponse({
    required this.isMuted,
    this.mutedUntil,
  });

  factory MutedStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$MutedStatusResponseFromJson(json);

  Map<String, dynamic> toJson() => _$MutedStatusResponseToJson(this);
}

@JsonSerializable()
class AddReactionRequest {
  final String emoji;

  const AddReactionRequest({
    required this.emoji,
  });

  factory AddReactionRequest.fromJson(Map<String, dynamic> json) =>
      _$AddReactionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AddReactionRequestToJson(this);
}

@JsonSerializable()
class UnreadCountResponse {
  final int count;

  const UnreadCountResponse({
    required this.count,
  });

  factory UnreadCountResponse.fromJson(Map<String, dynamic> json) =>
      _$UnreadCountResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UnreadCountResponseToJson(this);
}

@JsonSerializable()
class AddParticipantRequest {
  final String userId;

  const AddParticipantRequest({
    required this.userId,
  });

  factory AddParticipantRequest.fromJson(Map<String, dynamic> json) =>
      _$AddParticipantRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AddParticipantRequestToJson(this);
}
