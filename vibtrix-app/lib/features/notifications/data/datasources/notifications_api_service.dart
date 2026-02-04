import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../models/notification_model.dart';

part 'notifications_api_service.g.dart';

/// Notifications API Service - Matches Backend API exactly
/// All endpoints verified against API_DOCUMENTATION.txt
@RestApi()
abstract class NotificationsApiService {
  factory NotificationsApiService(Dio dio, {String baseUrl}) = _NotificationsApiService;

  // ============ NOTIFICATION ENDPOINTS ============

  /// GET /notifications - Get notifications
  @GET('/notifications')
  Future<PaginatedResponse<NotificationModel>> getNotifications({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  /// GET /notifications/unread-count - Get unread count
  @GET('/notifications/unread-count')
  Future<UnreadCountModel> getUnreadCount();

  /// POST /notifications/{notificationId}/read - Mark notification as read
  @POST('/notifications/{notificationId}/read')
  Future<void> markAsRead(@Path('notificationId') String notificationId);

  /// PATCH /notifications/mark-as-read - Mark all as read
  @PATCH('/notifications/mark-as-read')
  Future<void> markAllAsRead();

  // NOTE: These endpoints do NOT exist in backend:
  // - DELETE /notifications/{notificationId} - Delete individual notification
  // - DELETE /notifications - Clear all notifications
  // - GET /notifications/settings - Get notification settings
  // - PUT /notifications/settings - Update notification settings
  // - POST /notifications/devices - Register device
  // - DELETE /notifications/devices/{deviceId} - Unregister device
  // - PUT /notifications/devices/{deviceId} - Update device
}

// Additional request/response models
@JsonSerializable()
class UpdateDeviceRequest {
  final String? token;
  final bool? enabled;

  UpdateDeviceRequest({this.token, this.enabled});

  factory UpdateDeviceRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateDeviceRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateDeviceRequestToJson(this);
}

@JsonSerializable()
class NotificationSettingsResponse {
  final bool pushEnabled;
  final bool emailEnabled;
  final bool likesEnabled;
  final bool commentsEnabled;
  final bool followsEnabled;
  final bool mentionsEnabled;
  final bool competitionUpdates;
  final bool chatMessages;

  NotificationSettingsResponse({
    required this.pushEnabled,
    required this.emailEnabled,
    required this.likesEnabled,
    required this.commentsEnabled,
    required this.followsEnabled,
    required this.mentionsEnabled,
    required this.competitionUpdates,
    required this.chatMessages,
  });

  factory NotificationSettingsResponse.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationSettingsResponseToJson(this);
}

@JsonSerializable()
class UpdateNotificationSettingsRequest {
  final bool? pushEnabled;
  final bool? emailEnabled;
  final bool? likesEnabled;
  final bool? commentsEnabled;
  final bool? followsEnabled;
  final bool? mentionsEnabled;
  final bool? competitionUpdates;
  final bool? chatMessages;

  UpdateNotificationSettingsRequest({
    this.pushEnabled,
    this.emailEnabled,
    this.likesEnabled,
    this.commentsEnabled,
    this.followsEnabled,
    this.mentionsEnabled,
    this.competitionUpdates,
    this.chatMessages,
  });

  factory UpdateNotificationSettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateNotificationSettingsRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateNotificationSettingsRequestToJson(this);
}
