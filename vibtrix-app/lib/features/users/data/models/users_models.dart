import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';

part 'users_models.g.dart';

/// Response from follow/unfollow actions
@JsonSerializable()
class FollowResponse {
  final bool? success;
  final String? message;
  final bool? isFollowing;

  const FollowResponse({
    this.success,
    this.message,
    this.isFollowing,
  });

  factory FollowResponse.fromJson(Map<String, dynamic> json) =>
      _$FollowResponseFromJson(json);

  Map<String, dynamic> toJson() => _$FollowResponseToJson(this);
}

@JsonSerializable()
class FollowStatusResponse {
  final bool isFollowing;
  @JsonKey(defaultValue: false)
  final bool isFollowedBy;
  @JsonKey(defaultValue: false)
  final bool isPending;

  const FollowStatusResponse({
    required this.isFollowing,
    this.isFollowedBy = false,
    this.isPending = false,
  });

  factory FollowStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$FollowStatusResponseFromJson(json);

  Map<String, dynamic> toJson() => _$FollowStatusResponseToJson(this);
}

@JsonSerializable()
class BlockStatusResponse {
  final bool isBlocked;
  final bool isBlockedBy;

  const BlockStatusResponse({
    required this.isBlocked,
    this.isBlockedBy = false,
  });

  factory BlockStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$BlockStatusResponseFromJson(json);

  Map<String, dynamic> toJson() => _$BlockStatusResponseToJson(this);
}

@JsonSerializable()
class ReportUserRequest {
  final String reason;
  final String? description;

  const ReportUserRequest({
    required this.reason,
    this.description,
  });

  factory ReportUserRequest.fromJson(Map<String, dynamic> json) =>
      _$ReportUserRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ReportUserRequestToJson(this);
}

/// Request body for accepting/rejecting follow requests
@JsonSerializable()
class FollowRequestActionRequest {
  final String action; // "accept" or "reject"

  const FollowRequestActionRequest({
    required this.action,
  });

  factory FollowRequestActionRequest.fromJson(Map<String, dynamic> json) =>
      _$FollowRequestActionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$FollowRequestActionRequestToJson(this);
}

/// Response for recently joined users endpoint
@JsonSerializable()
class RecentlyJoinedResponse {
  final List<SimpleUserModel> users;
  final PaginationInfo pagination;

  const RecentlyJoinedResponse({
    required this.users,
    required this.pagination,
  });

  factory RecentlyJoinedResponse.fromJson(Map<String, dynamic> json) =>
      _$RecentlyJoinedResponseFromJson(json);

  Map<String, dynamic> toJson() => _$RecentlyJoinedResponseToJson(this);
}

/// Pagination info for recently joined users
@JsonSerializable()
class PaginationInfo {
  final int totalCount;
  final int totalPages;
  final int? currentPage;
  final int? limit;
  final bool hasNextPage;
  final bool hasPreviousPage;

  const PaginationInfo({
    required this.totalCount,
    required this.totalPages,
    this.currentPage,
    this.limit,
    required this.hasNextPage,
    required this.hasPreviousPage,
  });

  factory PaginationInfo.fromJson(Map<String, dynamic> json) =>
      _$PaginationInfoFromJson(json);

  Map<String, dynamic> toJson() => _$PaginationInfoToJson(this);
}
