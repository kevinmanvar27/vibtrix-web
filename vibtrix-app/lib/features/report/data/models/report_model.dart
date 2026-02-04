import 'package:json_annotation/json_annotation.dart';

part 'report_model.g.dart';

@JsonSerializable()
class ReportModel {
  final String id;
  final String reporterId;
  final ReportType type;
  final String targetId;
  final ReportReason reason;
  final String? description;
  final ReportStatus status;
  final DateTime createdAt;
  final DateTime? resolvedAt;

  const ReportModel({
    required this.id,
    required this.reporterId,
    required this.type,
    required this.targetId,
    required this.reason,
    this.description,
    this.status = ReportStatus.pending,
    required this.createdAt,
    this.resolvedAt,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) =>
      _$ReportModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReportModelToJson(this);
}

enum ReportType {
  @JsonValue('user')
  user,
  @JsonValue('post')
  post,
  @JsonValue('comment')
  comment,
  @JsonValue('message')
  message,
  @JsonValue('competition')
  competition,
}

enum ReportReason {
  @JsonValue('spam')
  spam,
  @JsonValue('harassment')
  harassment,
  @JsonValue('hate_speech')
  hateSpeech,
  @JsonValue('violence')
  violence,
  @JsonValue('nudity')
  nudity,
  @JsonValue('false_information')
  falseInformation,
  @JsonValue('intellectual_property')
  intellectualProperty,
  @JsonValue('scam')
  scam,
  @JsonValue('impersonation')
  impersonation,
  @JsonValue('other')
  other,
}

enum ReportStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('reviewing')
  reviewing,
  @JsonValue('resolved')
  resolved,
  @JsonValue('dismissed')
  dismissed,
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class CreateReportRequest {
  final ReportType type;
  final String targetId;
  final ReportReason reason;
  final String? description;

  const CreateReportRequest({
    required this.type,
    required this.targetId,
    required this.reason,
    this.description,
  });

  factory CreateReportRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateReportRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateReportRequestToJson(this);
}
