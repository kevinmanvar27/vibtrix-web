// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'users_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FollowResponse _$FollowResponseFromJson(Map<String, dynamic> json) =>
    FollowResponse(
      success: json['success'] as bool?,
      message: json['message'] as String?,
      isFollowing: json['isFollowing'] as bool?,
    );

Map<String, dynamic> _$FollowResponseToJson(FollowResponse instance) =>
    <String, dynamic>{
      'success': instance.success,
      'message': instance.message,
      'isFollowing': instance.isFollowing,
    };

FollowStatusResponse _$FollowStatusResponseFromJson(
  Map<String, dynamic> json,
) => FollowStatusResponse(
  isFollowing: json['isFollowing'] as bool,
  isFollowedBy: json['isFollowedBy'] as bool? ?? false,
  isPending: json['isPending'] as bool? ?? false,
);

Map<String, dynamic> _$FollowStatusResponseToJson(
  FollowStatusResponse instance,
) => <String, dynamic>{
  'isFollowing': instance.isFollowing,
  'isFollowedBy': instance.isFollowedBy,
  'isPending': instance.isPending,
};

BlockStatusResponse _$BlockStatusResponseFromJson(Map<String, dynamic> json) =>
    BlockStatusResponse(
      isBlocked: json['isBlocked'] as bool,
      isBlockedBy: json['isBlockedBy'] as bool? ?? false,
    );

Map<String, dynamic> _$BlockStatusResponseToJson(
  BlockStatusResponse instance,
) => <String, dynamic>{
  'isBlocked': instance.isBlocked,
  'isBlockedBy': instance.isBlockedBy,
};

ReportUserRequest _$ReportUserRequestFromJson(Map<String, dynamic> json) =>
    ReportUserRequest(
      reason: json['reason'] as String,
      description: json['description'] as String?,
    );

Map<String, dynamic> _$ReportUserRequestToJson(ReportUserRequest instance) =>
    <String, dynamic>{
      'reason': instance.reason,
      'description': instance.description,
    };

FollowRequestActionRequest _$FollowRequestActionRequestFromJson(
        Map<String, dynamic> json) =>
    FollowRequestActionRequest(
      action: json['action'] as String,
    );

Map<String, dynamic> _$FollowRequestActionRequestToJson(
        FollowRequestActionRequest instance) =>
    <String, dynamic>{
      'action': instance.action,
    };

RecentlyJoinedResponse _$RecentlyJoinedResponseFromJson(
        Map<String, dynamic> json) =>
    RecentlyJoinedResponse(
      users: (json['users'] as List<dynamic>)
          .map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pagination:
          PaginationInfo.fromJson(json['pagination'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$RecentlyJoinedResponseToJson(
        RecentlyJoinedResponse instance) =>
    <String, dynamic>{
      'users': instance.users.map((e) => e.toJson()).toList(),
      'pagination': instance.pagination.toJson(),
    };

PaginationInfo _$PaginationInfoFromJson(Map<String, dynamic> json) =>
    PaginationInfo(
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
      totalPages: (json['totalPages'] as num?)?.toInt() ?? 0,
      currentPage: (json['currentPage'] as num?)?.toInt(),
      limit: (json['limit'] as num?)?.toInt(),
      hasNextPage: json['hasNextPage'] as bool? ?? false,
      hasPreviousPage: json['hasPreviousPage'] as bool? ?? false,
    );

Map<String, dynamic> _$PaginationInfoToJson(PaginationInfo instance) =>
    <String, dynamic>{
      'totalCount': instance.totalCount,
      'totalPages': instance.totalPages,
      'currentPage': instance.currentPage,
      'limit': instance.limit,
      'hasNextPage': instance.hasNextPage,
      'hasPreviousPage': instance.hasPreviousPage,
    };
