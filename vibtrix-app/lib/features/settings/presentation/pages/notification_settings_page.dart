import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'settings_page.dart';

/// Notification settings page
/// 
/// NOTE: Backend notification settings endpoints are not implemented yet.
/// Settings are persisted locally using SharedPreferences.
/// TODO: Sync with backend once notification settings API is available.
class NotificationSettingsPage extends ConsumerWidget {
  const NotificationSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsStateProvider);
    final notifier = ref.read(settingsStateProvider.notifier);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Enable all push notifications'),
            value: settings.pushNotifications,
            onChanged: (value) => notifier.togglePushNotifications(value),
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Activity',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          SwitchListTile(
            title: const Text('Likes'),
            value: settings.notifyLikes,
            onChanged: settings.pushNotifications
                ? (value) => notifier.toggleNotifyLikes(value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Comments'),
            value: settings.notifyComments,
            onChanged: settings.pushNotifications
                ? (value) => notifier.toggleNotifyComments(value)
                : null,
          ),
          SwitchListTile(
            title: const Text('New Followers'),
            value: settings.notifyFollowers,
            onChanged: settings.pushNotifications
                ? (value) => notifier.toggleNotifyFollowers(value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Direct Messages'),
            value: settings.notifyMessages,
            onChanged: settings.pushNotifications
                ? (value) => notifier.toggleNotifyMessages(value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Competitions'),
            value: settings.notifyCompetitions,
            onChanged: settings.pushNotifications
                ? (value) => notifier.toggleNotifyCompetitions(value)
                : null,
          ),
        ],
      ),
    );
  }
}
