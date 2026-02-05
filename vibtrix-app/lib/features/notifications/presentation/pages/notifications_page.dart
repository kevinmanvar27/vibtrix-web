import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../settings/presentation/pages/settings_page.dart';
import '../../../users/data/models/users_models.dart';
import '../../../auth/data/models/user_model.dart';
import '../../data/models/notification_model.dart';
import '../providers/notifications_provider.dart';

/// Page showing user notifications
/// CONNECTED TO REAL API
/// Filters notifications based on user preferences from settings
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    final settings = ref.watch(settingsStateProvider);
    
    // Filter notifications based on user preferences
    final filteredNotifications = _filterNotifications(state.notifications, settings);
    final unreadCount = filteredNotifications.where((n) => !n.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications'),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all),
              tooltip: 'Mark all as read',
              onPressed: () => _showMarkAllReadDialog(context, ref),
            ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'settings') {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const NotificationPreferencesPage(),
                  ),
                );
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings),
                    SizedBox(width: 8),
                    Text('Notification Settings'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : state.errorMessage != null
              ? _buildErrorState(context, ref, state.errorMessage!)
              : filteredNotifications.isEmpty
                  ? _buildEmptyState(context)
                  : RefreshIndicator(
                      onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
                      child: _buildNotificationsList(context, ref, filteredNotifications, settings),
                    ),
    );
  }

  /// Filter notifications based on user preferences
  List<NotificationModel> _filterNotifications(List<NotificationModel> notifications, SettingsState settings) {
    return notifications.where((notification) {
      switch (notification.type) {
        case NotificationType.like:
          return settings.notifyLikes;
        case NotificationType.comment:
          return settings.notifyComments;
        case NotificationType.follow:
        case NotificationType.followRequest:
        case NotificationType.followAccepted:
          return settings.notifyFollowers;
        case NotificationType.mention:
          return settings.notifyMentions;
        case NotificationType.competitionStart:
        case NotificationType.competitionEnd:
        case NotificationType.competitionResult:
        case NotificationType.competitionReminder:
          return settings.notifyCompetitions;
        case NotificationType.newMessage:
          return settings.notifyMessages;
        case NotificationType.payment:
        case NotificationType.system:
          return true; // Always show payment and system notifications
      }
    }).toList();
  }

  void _showMarkAllReadDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Mark all as read?'),
        content: const Text('All notifications will be marked as read.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              ref.read(notificationsProvider.notifier).markAllAsRead();
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications marked as read')),
              );
            },
            child: const Text('Mark All Read'),
          ),
        ],
      ),
    );
  }

  void _handleNotificationTap(BuildContext context, WidgetRef ref, NotificationModel notification, SettingsState settings) {
    // Mark as read
    ref.read(notificationsProvider.notifier).markAsRead(notification.id);

    // Navigate based on type
    switch (notification.type) {
      case NotificationType.like:
      case NotificationType.comment:
      case NotificationType.mention:
        if (notification.data?.postId != null) {
          context.push('/post/${notification.data!.postId}');
        }
        break;
      case NotificationType.follow:
      case NotificationType.followAccepted:
        if (notification.actor != null) {
          context.push('/profile/${notification.actor!.id}');
        }
        break;
      case NotificationType.followRequest:
        // For follow requests, show approval dialog if private account
        if (settings.privateAccount && notification.actor != null) {
          _showFollowRequestDialog(context, ref, notification);
        } else if (notification.actor != null) {
          context.push('/profile/${notification.actor!.id}');
        }
        break;
      case NotificationType.competitionStart:
      case NotificationType.competitionEnd:
      case NotificationType.competitionResult:
      case NotificationType.competitionReminder:
        if (notification.data?.competitionId != null) {
          context.push('/competition/${notification.data!.competitionId}');
        }
        break;
      case NotificationType.newMessage:
        if (notification.data?.chatId != null) {
          context.push('/chat/${notification.data!.chatId}');
        }
        break;
      case NotificationType.payment:
        context.push('/wallet');
        break;
      case NotificationType.system:
        // Show system notification detail
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(notification.body ?? 'System notification')),
        );
        break;
    }
  }

  /// Show dialog to approve/reject follow request (for private accounts)
  void _showFollowRequestDialog(BuildContext context, WidgetRef ref, NotificationModel notification) {
    final actor = notification.actor!;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Follow Request'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NetworkAvatar(
              imageUrl: actor.profilePicture,
              radius: 40,
              fallbackText: actor.username,
            ),
            const SizedBox(height: 12),
            Text(
              actor.name ?? actor.username,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              '@${actor.username}',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 8),
            const Text('wants to follow you'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              // Reject follow request
              final repository = ref.read(usersRepositoryProvider);
              // Use the notification ID or data.userId as the request ID
              final requestId = notification.data?.userId ?? notification.id;
              final result = await repository.rejectFollowRequest(requestId);
              result.fold(
                (failure) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to reject request')),
                  );
                },
                (_) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Rejected @${actor.username}\'s request')),
                  );
                  ref.read(notificationsProvider.notifier).refresh();
                },
              );
            },
            child: const Text('Reject', style: TextStyle(color: Colors.red)),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              // Accept follow request
              final repository = ref.read(usersRepositoryProvider);
              final requestId = notification.data?.userId ?? notification.id;
              final result = await repository.acceptFollowRequest(requestId);
              result.fold(
                (failure) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to accept request')),
                  );
                },
                (_) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Accepted @${actor.username}\'s request')),
                  );
                  ref.read(notificationsProvider.notifier).refresh();
                },
              );
            },
            child: const Text('Accept'),
          ),
        ],
      ),
    );
  }

  IconData _getNotificationIcon(NotificationType type) {
    switch (type) {
      case NotificationType.like:
        return Icons.favorite;
      case NotificationType.comment:
        return Icons.chat_bubble;
      case NotificationType.follow:
      case NotificationType.followRequest:
      case NotificationType.followAccepted:
        return Icons.person_add;
      case NotificationType.mention:
        return Icons.alternate_email;
      case NotificationType.competitionStart:
      case NotificationType.competitionEnd:
      case NotificationType.competitionResult:
      case NotificationType.competitionReminder:
        return Icons.emoji_events;
      case NotificationType.newMessage:
        return Icons.message;
      case NotificationType.payment:
        return Icons.account_balance_wallet;
      case NotificationType.system:
        return Icons.info;
    }
  }

  Color _getNotificationColor(NotificationType type) {
    switch (type) {
      case NotificationType.like:
        return Colors.red;
      case NotificationType.comment:
        return Colors.blue;
      case NotificationType.follow:
      case NotificationType.followRequest:
      case NotificationType.followAccepted:
        return Colors.purple;
      case NotificationType.mention:
        return Colors.orange;
      case NotificationType.competitionStart:
      case NotificationType.competitionEnd:
      case NotificationType.competitionResult:
      case NotificationType.competitionReminder:
        return Colors.amber;
      case NotificationType.newMessage:
        return Colors.green;
      case NotificationType.payment:
        return Colors.teal;
      case NotificationType.system:
        return Colors.grey;
    }
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String message) {
    return RefreshIndicator(
      onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: MediaQuery.of(context).size.height * 0.7,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: AppColors.error),
                const SizedBox(height: 16),
                Text(message, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.read(notificationsProvider.notifier).refresh(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'When you get notifications, they\'ll show up here',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade500,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsList(BuildContext context, WidgetRef ref, List<NotificationModel> notifications, SettingsState settings) {
    // Group notifications by date
    final today = <NotificationModel>[];
    final yesterday = <NotificationModel>[];
    final earlier = <NotificationModel>[];

    // Separate follow requests for private accounts
    final followRequests = <NotificationModel>[];

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final yesterdayStart = todayStart.subtract(const Duration(days: 1));

    for (final notification in notifications) {
      // Separate follow requests if private account is enabled
      if (settings.privateAccount && notification.type == NotificationType.followRequest) {
        followRequests.add(notification);
        continue;
      }
      
      if (notification.createdAt.isAfter(todayStart)) {
        today.add(notification);
      } else if (notification.createdAt.isAfter(yesterdayStart)) {
        yesterday.add(notification);
      } else {
        earlier.add(notification);
      }
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        // Follow Requests Section (for private accounts)
        if (followRequests.isNotEmpty) ...[
          _buildSectionHeader(context, 'Follow Requests'),
          ...followRequests.map((n) => _buildFollowRequestTile(context, ref, n)),
          const Divider(height: 24),
        ],
        if (today.isNotEmpty) ...[
          _buildSectionHeader(context, 'Today'),
          ...today.map((n) => _buildNotificationTile(context, ref, n, settings)),
        ],
        if (yesterday.isNotEmpty) ...[
          _buildSectionHeader(context, 'Yesterday'),
          ...yesterday.map((n) => _buildNotificationTile(context, ref, n, settings)),
        ],
        if (earlier.isNotEmpty) ...[
          _buildSectionHeader(context, 'Earlier'),
          ...earlier.map((n) => _buildNotificationTile(context, ref, n, settings)),
        ],
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  /// Build follow request tile with Accept/Reject buttons (Instagram-style)
  Widget _buildFollowRequestTile(BuildContext context, WidgetRef ref, NotificationModel notification) {
    final actor = notification.actor;
    if (actor == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: notification.isRead 
          ? null 
          : Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.push('/profile/${actor.id}'),
            child: NetworkAvatar(
              imageUrl: actor.profilePicture,
              radius: 24,
              fallbackText: actor.username,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/profile/${actor.id}'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: Theme.of(context).textTheme.bodyMedium,
                      children: [
                        TextSpan(
                          text: actor.name ?? actor.username,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const TextSpan(text: ' requested to follow you'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    timeago.format(notification.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade500,
                        ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Accept button
          SizedBox(
            height: 32,
            child: FilledButton(
              onPressed: () async {
                final repository = ref.read(usersRepositoryProvider);
                final requestId = notification.data?.userId ?? notification.id;
                final result = await repository.acceptFollowRequest(requestId);
                result.fold(
                  (failure) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to accept request')),
                    );
                  },
                  (_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Accepted @${actor.username}')),
                    );
                    ref.read(notificationsProvider.notifier).refresh();
                  },
                );
              },
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                textStyle: const TextStyle(fontSize: 13),
              ),
              child: const Text('Accept'),
            ),
          ),
          const SizedBox(width: 8),
          // Reject button
          SizedBox(
            height: 32,
            child: OutlinedButton(
              onPressed: () async {
                final repository = ref.read(usersRepositoryProvider);
                final requestId = notification.data?.userId ?? notification.id;
                final result = await repository.rejectFollowRequest(requestId);
                result.fold(
                  (failure) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to reject request')),
                    );
                  },
                  (_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Rejected @${actor.username}')),
                    );
                    ref.read(notificationsProvider.notifier).refresh();
                  },
                );
              },
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                textStyle: const TextStyle(fontSize: 13),
              ),
              child: const Text('Reject'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationTile(BuildContext context, WidgetRef ref, NotificationModel notification, SettingsState settings) {
    final iconColor = _getNotificationColor(notification.type);
    
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) {
        ref.read(notificationsProvider.notifier).deleteNotification(notification.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification deleted')),
        );
      },
      child: InkWell(
        onTap: () => _handleNotificationTap(context, ref, notification, settings),
        child: Container(
          color: notification.isRead 
              ? null 
              : Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar or Icon
              Stack(
                children: [
                  if (notification.actor != null)
                    NetworkAvatar(
                      imageUrl: notification.actor!.profilePicture,
                      radius: 24,
                      fallbackText: notification.actor!.username,
                    )
                  else
                    CircleAvatar(
                      radius: 24,
                      backgroundColor: iconColor.withValues(alpha: 0.1),
                      child: Icon(
                        _getNotificationIcon(notification.type),
                        color: iconColor,
                        size: 24,
                      ),
                    ),
                  // Type indicator badge
                  if (notification.actor != null)
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: iconColor,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Theme.of(context).scaffoldBackgroundColor,
                            width: 2,
                          ),
                        ),
                        child: Icon(
                          _getNotificationIcon(notification.type),
                          color: Colors.white,
                          size: 10,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: TextSpan(
                        style: Theme.of(context).textTheme.bodyMedium,
                        children: [
                          if (notification.actor != null)
                            TextSpan(
                              text: notification.actor!.name ?? notification.actor!.username,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          TextSpan(
                            text: notification.actor != null 
                                ? ' ${notification.body ?? notification.title}'
                                : notification.body ?? notification.title,
                          ),
                        ],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeago.format(notification.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade500,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Post thumbnail or unread indicator
              if (notification.imageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: notification.imageUrl!,
                    width: 48,
                    height: 48,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 48,
                      height: 48,
                      color: Colors.grey.shade200,
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 48,
                      height: 48,
                      color: Colors.grey.shade200,
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
                  ),
                )
              else if (!notification.isRead)
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
