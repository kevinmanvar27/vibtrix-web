import '../../../../core/utils/either.dart';
import '../../../../core/models/base_response.dart';
import '../../data/models/notification_model.dart';
import '../../data/datasources/notifications_api_service.dart'
    show UpdateDeviceRequest, NotificationSettingsResponse, UpdateNotificationSettingsRequest;

/// Abstract repository for notification operations
abstract class NotificationsRepository {
  // Notification list operations
  Future<Result<PaginatedResponse<NotificationModel>>> getNotifications({
    NotificationType? type,
    bool? unreadOnly,
    String? cursor,
    int limit = 20,
  });
  Future<Result<void>> deleteNotification(String notificationId);
  Future<Result<void>> clearAllNotifications();
  
  // Read status
  Future<Result<void>> markAsRead(String notificationId);
  Future<Result<void>> markAllAsRead();
  Future<Result<UnreadCountModel>> getUnreadCount();
  
  // Device registration for push notifications
  Future<Result<DeviceTokenModel>> registerDevice(RegisterDeviceRequest request);
  Future<Result<void>> unregisterDevice(String deviceId);
  Future<Result<DeviceTokenModel>> updateDevice(String deviceId, UpdateDeviceRequest request);
  
  // Notification settings
  Future<Result<NotificationSettingsResponse>> getNotificationSettings();
  Future<Result<NotificationSettingsResponse>> updateNotificationSettings(
    UpdateNotificationSettingsRequest request,
  );
}
