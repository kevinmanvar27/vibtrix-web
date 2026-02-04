import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/router/route_names.dart';

/// Help and support page
class HelpPage extends ConsumerWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
      ),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('FAQs'),
            subtitle: const Text('Frequently asked questions'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              launchUrl(Uri.parse('https://vidibattle.com/faq'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.email_outlined),
            title: const Text('Contact Support'),
            subtitle: const Text('Get help from our team'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              launchUrl(Uri.parse('mailto:support@vidibattle.com?subject=VidiBattle Support Request'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.bug_report_outlined),
            title: const Text('Report a Bug'),
            subtitle: const Text('Help us fix issues'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              context.push(RouteNames.feedback);
            },
          ),
          const Divider(),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Contact Us',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text('Email: support@vidibattle.com'),
                SizedBox(height: 4),
                Text('Response time: 24-48 hours'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
