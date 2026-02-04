/// Notifications state management using Riverpod
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../data/models/notification_model.dart';
import '../../domain/repositories/notifications_repository.dart';

// ============================================================================
// Notifications State
// ============================================================================

class NotificationsState {
  final List<NotificationModel> notifications;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;
  final int unreadCount;

  const NotificationsState({
    this.notifications = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
    this.unreadCount = 0,
  });

  NotificationsState copyWith({
    List<NotificationModel>? notifications,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    int? unreadCount,
    bool clearError = false,
  }) {
    return NotificationsState(
      notifications: notifications ?? this.notifications,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

// ============================================================================
// Notifications Notifier - Connected to Real API
// ============================================================================

class NotificationsNotifier extends StateNotifier<NotificationsState> {
  final NotificationsRepository _repository;

  NotificationsNotifier(this._repository) : super(const NotificationsState()) {
    loadNotifications();
    loadUnreadCount();
  }

  /// Load notifications from real API
  Future<void> loadNotifications({bool refresh = false}) async {
    if (state.isLoading) return;

    debugPrint('📬 [NotificationsProvider] Loading notifications (refresh: $refresh)');

    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        notifications: [],
        cursor: null,
        hasMore: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    final result = await _repository.getNotifications(limit: 20);

    result.fold(
      (failure) {
        debugPrint('❌ [NotificationsProvider] Failed to load notifications: ${_getErrorMessage(failure)}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
      },
      (response) {
        debugPrint('✅ [NotificationsProvider] Loaded ${response.data.length} notifications');
        state = state.copyWith(
          isLoading: false,
          notifications: response.data,
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  /// Load more notifications (pagination)
  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;

    debugPrint('📬 [NotificationsProvider] Loading more notifications (cursor: ${state.cursor})');
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getNotifications(
      cursor: state.cursor,
      limit: 20,
    );

    result.fold(
      (failure) {
        debugPrint('❌ [NotificationsProvider] Failed to load more notifications');
        state = state.copyWith(isLoadingMore: false);
      },
      (response) {
        debugPrint('✅ [NotificationsProvider] Loaded ${response.data.length} more notifications');
        state = state.copyWith(
          isLoadingMore: false,
          notifications: [...state.notifications, ...response.data],
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  /// Load unread count
  Future<void> loadUnreadCount() async {
    debugPrint('📬 [NotificationsProvider] Loading unread count');
    final result = await _repository.getUnreadCount();
    result.fold(
      (failure) {
        debugPrint('❌ [NotificationsProvider] Failed to load unread count');
      },
      (unreadCount) {
        debugPrint('✅ [NotificationsProvider] Unread count: ${unreadCount.total}');
        state = state.copyWith(unreadCount: unreadCount.total);
      },
    );
  }

  /// Mark notification as read
  Future<void> markAsRead(String notificationId) async {
    debugPrint('📬 [NotificationsProvider] Marking notification as read: $notificationId');
    
    // Optimistic update
    state = state.copyWith(
      notifications: state.notifications.map((n) {
        if (n.id == notificationId && !n.isRead) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList(),
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
    );

    // Make API call
    await _repository.markAsRead(notificationId);
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    debugPrint('📬 [NotificationsProvider] Marking all notifications as read');
    
    // Optimistic update
    state = state.copyWith(
      notifications: state.notifications.map((n) => n.copyWith(isRead: true)).toList(),
      unreadCount: 0,
    );

    // Make API call
    await _repository.markAllAsRead();
  }

  /// Delete notification
  Future<void> deleteNotification(String notificationId) async {
    debugPrint('📬 [NotificationsProvider] Deleting notification: $notificationId');
    
    final notification = state.notifications.firstWhere(
      (n) => n.id == notificationId,
      orElse: () => state.notifications.first,
    );
    
    // Optimistic update
    state = state.copyWith(
      notifications: state.notifications.where((n) => n.id != notificationId).toList(),
      unreadCount: !notification.isRead && state.unreadCount > 0 
          ? state.unreadCount - 1 
          : state.unreadCount,
    );

    // Make API call
    await _repository.deleteNotification(notificationId);
  }

  /// Refresh notifications
  Future<void> refresh() async {
    debugPrint('📬 [NotificationsProvider] Refreshing notifications');
    await loadNotifications(refresh: true);
    await loadUnreadCount();
  }

  String _getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return 'No internet connection';
    } else if (failure is ServerFailure) {
      return 'Server error. Please try again.';
    }
    return failure.message ?? 'Failed to load notifications';
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main notifications provider - connected to real API
final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, NotificationsState>((ref) {
  final repository = ref.watch(notificationsRepositoryProvider);
  return NotificationsNotifier(repository);
});

/// Unread count provider (convenience)
final unreadNotificationsCountProvider = Provider<int>((ref) {
  return ref.watch(notificationsProvider).unreadCount;
});

/// Notifications loading provider (convenience)
final notificationsLoadingProvider = Provider<bool>((ref) {
  return ref.watch(notificationsProvider).isLoading;
});
