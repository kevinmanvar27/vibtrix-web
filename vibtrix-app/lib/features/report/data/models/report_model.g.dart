// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReportModel _$ReportModelFromJson(Map<String, dynamic> json) => ReportModel(
  id: json['id'] as String,
  reporterId: json['reporterId'] as String,
  type: $enumDecode(_$ReportTypeEnumMap, json['type']),
  targetId: json['targetId'] as String,
  reason: $enumDecode(_$ReportReasonEnumMap, json['reason']),
  description: json['description'] as String?,
  status:
      $enumDecodeNullable(_$ReportStatusEnumMap, json['status']) ??
      ReportStatus.pending,
  createdAt: DateTime.parse(json['createdAt'] as String),
  resolvedAt:
      json['resolvedAt'] == null
          ? null
          : DateTime.parse(json['resolvedAt'] as String),
);

Map<String, dynamic> _$ReportModelToJson(ReportModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'reporterId': instance.reporterId,
      'type': _$ReportTypeEnumMap[instance.type]!,
      'targetId': instance.targetId,
      'reason': _$ReportReasonEnumMap[instance.reason]!,
      'description': instance.description,
      'status': _$ReportStatusEnumMap[instance.status]!,
      'createdAt': instance.createdAt.toIso8601String(),
      'resolvedAt': instance.resolvedAt?.toIso8601String(),
    };

const _$ReportTypeEnumMap = {
  ReportType.user: 'user',
  ReportType.post: 'post',
  ReportType.comment: 'comment',
  ReportType.message: 'message',
  ReportType.competition: 'competition',
};

const _$ReportReasonEnumMap = {
  ReportReason.spam: 'spam',
  ReportReason.harassment: 'harassment',
  ReportReason.hateSpeech: 'hate_speech',
  ReportReason.violence: 'violence',
  ReportReason.nudity: 'nudity',
  ReportReason.falseInformation: 'false_information',
  ReportReason.intellectualProperty: 'intellectual_property',
  ReportReason.scam: 'scam',
  ReportReason.impersonation: 'impersonation',
  ReportReason.other: 'other',
};

const _$ReportStatusEnumMap = {
  ReportStatus.pending: 'pending',
  ReportStatus.reviewing: 'reviewing',
  ReportStatus.resolved: 'resolved',
  ReportStatus.dismissed: 'dismissed',
};

CreateReportRequest _$CreateReportRequestFromJson(Map<String, dynamic> json) =>
    CreateReportRequest(
      type: $enumDecode(_$ReportTypeEnumMap, json['type']),
      targetId: json['targetId'] as String,
      reason: $enumDecode(_$ReportReasonEnumMap, json['reason']),
      description: json['description'] as String?,
    );

Map<String, dynamic> _$CreateReportRequestToJson(
  CreateReportRequest instance,
) => <String, dynamic>{
  'type': _$ReportTypeEnumMap[instance.type]!,
  'targetId': instance.targetId,
  'reason': _$ReportReasonEnumMap[instance.reason]!,
  'description': instance.description,
};
