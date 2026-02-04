import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// About page showing app info and legal links
class AboutPage extends ConsumerWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About'),
      ),
      body: ListView(
        children: [
          const SizedBox(height: 32),
          Center(
            child: Column(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.video_library,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'VidiBattle',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const Text(
                  'Version 1.0.0',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          ListTile(
            leading: const Icon(Icons.description_outlined),
            title: const Text('Terms of Service'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () {
              launchUrl(Uri.parse('https://vidibattle.com/terms'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy Policy'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () {
              launchUrl(Uri.parse('https://vidibattle.com/privacy'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.gavel_outlined),
            title: const Text('Licenses'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              showLicensePage(
                context: context,
                applicationName: 'VidiBattle',
                applicationVersion: '1.0.0',
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.star_outline),
            title: const Text('Rate Us'),
            onTap: () {
              // Open app store (placeholder URL - update with actual app store links)
              launchUrl(Uri.parse('https://play.google.com/store/apps/details?id=com.vidibattle.app'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.share_outlined),
            title: const Text('Share App'),
            onTap: () {
              Share.share(
                'Check out VidiBattle - the ultimate video competition app! Download now: https://vidibattle.com/download',
                subject: 'VidiBattle App',
              );
            },
          ),
        ],
      ),
    );
  }
}
