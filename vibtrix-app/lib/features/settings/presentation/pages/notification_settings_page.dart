import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Notification settings page
class NotificationSettingsPage extends ConsumerStatefulWidget {
  const NotificationSettingsPage({super.key});

  @override
  ConsumerState<NotificationSettingsPage> createState() => _NotificationSettingsPageState();
}

class _NotificationSettingsPageState extends ConsumerState<NotificationSettingsPage> {
  bool _pushNotifications = true;
  bool _likes = true;
  bool _comments = true;
  bool _follows = true;
  bool _messages = true;
  bool _competitions = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Enable all push notifications'),
            value: _pushNotifications,
            onChanged: (value) {
              setState(() => _pushNotifications = value);
            },
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
            value: _likes,
            onChanged: _pushNotifications
                ? (value) => setState(() => _likes = value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Comments'),
            value: _comments,
            onChanged: _pushNotifications
                ? (value) => setState(() => _comments = value)
                : null,
          ),
          SwitchListTile(
            title: const Text('New Followers'),
            value: _follows,
            onChanged: _pushNotifications
                ? (value) => setState(() => _follows = value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Direct Messages'),
            value: _messages,
            onChanged: _pushNotifications
                ? (value) => setState(() => _messages = value)
                : null,
          ),
          SwitchListTile(
            title: const Text('Competitions'),
            value: _competitions,
            onChanged: _pushNotifications
                ? (value) => setState(() => _competitions = value)
                : null,
          ),
        ],
      ),
    );
  }
}
