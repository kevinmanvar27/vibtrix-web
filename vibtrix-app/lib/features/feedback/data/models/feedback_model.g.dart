// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FeedbackModel _$FeedbackModelFromJson(Map<String, dynamic> json) =>
    FeedbackModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: $enumDecode(_$FeedbackTypeEnumMap, json['type']),
      subject: json['subject'] as String,
      message: json['message'] as String,
      rating: (json['rating'] as num?)?.toInt(),
      attachments:
          (json['attachments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList(),
      status:
          $enumDecodeNullable(_$FeedbackStatusEnumMap, json['status']) ??
          FeedbackStatus.pending,
      response: json['response'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      respondedAt:
          json['respondedAt'] == null
              ? null
              : DateTime.parse(json['respondedAt'] as String),
    );

Map<String, dynamic> _$FeedbackModelToJson(FeedbackModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'type': _$FeedbackTypeEnumMap[instance.type]!,
      'subject': instance.subject,
      'message': instance.message,
      'rating': instance.rating,
      'attachments': instance.attachments,
      'status': _$FeedbackStatusEnumMap[instance.status]!,
      'response': instance.response,
      'createdAt': instance.createdAt.toIso8601String(),
      'respondedAt': instance.respondedAt?.toIso8601String(),
    };

const _$FeedbackTypeEnumMap = {
  FeedbackType.bug: 'bug',
  FeedbackType.feature: 'feature',
  FeedbackType.improvement: 'improvement',
  FeedbackType.question: 'question',
  FeedbackType.other: 'other',
};

const _$FeedbackStatusEnumMap = {
  FeedbackStatus.pending: 'pending',
  FeedbackStatus.inProgress: 'in_progress',
  FeedbackStatus.resolved: 'resolved',
  FeedbackStatus.closed: 'closed',
};

FeedbackCategoryModel _$FeedbackCategoryModelFromJson(
  Map<String, dynamic> json,
) => FeedbackCategoryModel(
  id: json['id'] as String,
  name: json['name'] as String,
  description: json['description'] as String?,
  icon: json['icon'] as String?,
  isActive: json['is_active'] as bool? ?? true,
);

Map<String, dynamic> _$FeedbackCategoryModelToJson(
  FeedbackCategoryModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'icon': instance.icon,
  'is_active': instance.isActive,
};

CreateFeedbackRequest _$CreateFeedbackRequestFromJson(
  Map<String, dynamic> json,
) => CreateFeedbackRequest(
  type: $enumDecode(_$FeedbackTypeEnumMap, json['type']),
  subject: json['subject'] as String,
  message: json['message'] as String,
  rating: (json['rating'] as num?)?.toInt(),
  attachments:
      (json['attachments'] as List<dynamic>?)?.map((e) => e as String).toList(),
);

Map<String, dynamic> _$CreateFeedbackRequestToJson(
  CreateFeedbackRequest instance,
) => <String, dynamic>{
  'type': _$FeedbackTypeEnumMap[instance.type]!,
  'subject': instance.subject,
  'message': instance.message,
  'rating': instance.rating,
  'attachments': instance.attachments,
};
