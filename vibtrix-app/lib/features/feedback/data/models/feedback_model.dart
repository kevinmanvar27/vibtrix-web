import 'package:json_annotation/json_annotation.dart';

part 'feedback_model.g.dart';

@JsonSerializable()
class FeedbackModel {
  final String id;
  final String userId;
  final FeedbackType type;
  final String subject;
  final String message;
  final int? rating;
  final List<String>? attachments;
  final FeedbackStatus status;
  final String? response;
  final DateTime createdAt;
  final DateTime? respondedAt;

  const FeedbackModel({
    required this.id,
    required this.userId,
    required this.type,
    required this.subject,
    required this.message,
    this.rating,
    this.attachments,
    this.status = FeedbackStatus.pending,
    this.response,
    required this.createdAt,
    this.respondedAt,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) =>
      _$FeedbackModelFromJson(json);

  Map<String, dynamic> toJson() => _$FeedbackModelToJson(this);
}

@JsonSerializable()
class FeedbackCategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? icon;
  @JsonKey(name: 'is_active')
  final bool isActive;

  const FeedbackCategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.icon,
    this.isActive = true,
  });

  factory FeedbackCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$FeedbackCategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$FeedbackCategoryModelToJson(this);
}

enum FeedbackType {
  @JsonValue('bug')
  bug,
  @JsonValue('feature')
  feature,
  @JsonValue('improvement')
  improvement,
  @JsonValue('question')
  question,
  @JsonValue('other')
  other,
}

enum FeedbackStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('in_progress')
  inProgress,
  @JsonValue('resolved')
  resolved,
  @JsonValue('closed')
  closed,
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class CreateFeedbackRequest {
  final FeedbackType type;
  final String subject;
  final String message;
  final int? rating;
  final List<String>? attachments;

  const CreateFeedbackRequest({
    required this.type,
    required this.subject,
    required this.message,
    this.rating,
    this.attachments,
  });

  factory CreateFeedbackRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateFeedbackRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateFeedbackRequestToJson(this);
}
