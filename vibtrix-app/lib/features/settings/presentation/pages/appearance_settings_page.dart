import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/theme_provider.dart';

/// Appearance settings page for theme customization
class AppearanceSettingsPage extends ConsumerWidget {
  const AppearanceSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
      ),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              'Theme',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          RadioListTile<ThemeMode>(
            title: const Text('System Default'),
            subtitle: const Text('Follow system theme'),
            value: ThemeMode.system,
            groupValue: themeMode,
            onChanged: (value) {
              ref.read(themeModeProvider.notifier).setThemeMode(value!);
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light'),
            subtitle: const Text('Always use light theme'),
            value: ThemeMode.light,
            groupValue: themeMode,
            onChanged: (value) {
              ref.read(themeModeProvider.notifier).setThemeMode(value!);
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark'),
            subtitle: const Text('Always use dark theme'),
            value: ThemeMode.dark,
            groupValue: themeMode,
            onChanged: (value) {
              ref.read(themeModeProvider.notifier).setThemeMode(value!);
            },
          ),
        ],
      ),
    );
  }
}
