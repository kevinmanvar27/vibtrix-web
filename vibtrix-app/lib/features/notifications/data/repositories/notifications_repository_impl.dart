import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/models/base_response.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../datasources/notifications_api_service.dart';
import '../models/notification_model.dart';

/// Implementation of NotificationsRepository
/// NOTE: Many notification endpoints do NOT exist in the backend API.
/// Methods that call non-existent endpoints will throw UnimplementedError or return fallback values.
class NotificationsRepositoryImpl implements NotificationsRepository {
  final NotificationsApiService _apiService;

  NotificationsRepositoryImpl({required NotificationsApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<PaginatedResponse<NotificationModel>>> getNotifications({
    NotificationType? type,
    bool? unreadOnly,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      // NOTE: Backend API doesn't support 'type' filter
      final response = await _apiService.getNotifications(
        cursor: cursor,
        limit: limit,
      );
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteNotification(String notificationId) async {
    // NOTE: Backend does not have DELETE /notifications/{id} endpoint
    debugPrint('[NotificationsRepo] deleteNotification not implemented in backend');
    return Left(ServerFailure(message: 'Delete notification is not supported'));
  }

  @override
  Future<Result<void>> clearAllNotifications() async {
    // NOTE: Backend does not have DELETE /notifications endpoint
    debugPrint('[NotificationsRepo] clearAllNotifications not implemented in backend');
    return Left(ServerFailure(message: 'Clear all notifications is not supported'));
  }

  @override
  Future<Result<void>> markAsRead(String notificationId) async {
    try {
      await _apiService.markAsRead(notificationId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> markAllAsRead() async {
    try {
      await _apiService.markAllAsRead();
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<UnreadCountModel>> getUnreadCount() async {
    try {
      final count = await _apiService.getUnreadCount();
      return Right(count);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<DeviceTokenModel>> registerDevice(RegisterDeviceRequest request) async {
    // NOTE: Backend does not have POST /notifications/devices endpoint
    debugPrint('[NotificationsRepo] registerDevice not implemented in backend');
    return Left(ServerFailure(message: 'Device registration is not supported'));
  }

  @override
  Future<Result<void>> unregisterDevice(String deviceId) async {
    // NOTE: Backend does not have DELETE /notifications/devices/{id} endpoint
    debugPrint('[NotificationsRepo] unregisterDevice not implemented in backend');
    return Left(ServerFailure(message: 'Device unregistration is not supported'));
  }

  @override
  Future<Result<DeviceTokenModel>> updateDevice(
    String deviceId,
    UpdateDeviceRequest request,
  ) async {
    // NOTE: Backend does not have PUT /notifications/devices/{id} endpoint
    debugPrint('[NotificationsRepo] updateDevice not implemented in backend');
    return Left(ServerFailure(message: 'Device update is not supported'));
  }

  @override
  Future<Result<NotificationSettingsResponse>> getNotificationSettings() async {
    // NOTE: Backend does not have GET /notifications/settings endpoint
    debugPrint('[NotificationsRepo] getNotificationSettings not implemented in backend');
    // Return default settings
    return Right(NotificationSettingsResponse(
      pushEnabled: true,
      emailEnabled: true,
      likesEnabled: true,
      commentsEnabled: true,
      followsEnabled: true,
      mentionsEnabled: true,
      competitionUpdates: true,
      chatMessages: true,
    ));
  }

  @override
  Future<Result<NotificationSettingsResponse>> updateNotificationSettings(
    UpdateNotificationSettingsRequest request,
  ) async {
    // NOTE: Backend does not have PUT /notifications/settings endpoint
    debugPrint('[NotificationsRepo] updateNotificationSettings not implemented in backend');
    return Left(ServerFailure(message: 'Notification settings update is not supported'));
  }
}
