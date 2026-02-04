import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/storage/local_storage.dart';

/// Provider for the current theme mode
/// 
/// Reads from local storage on initialization and persists changes
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

/// Notifier for theme mode state management
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    _loadInitialTheme();
  }
  
  /// Load initial theme from storage
  Future<void> _loadInitialTheme() async {
    try {
      final savedMode = LocalStorage.getThemeMode();
      switch (savedMode) {
        case 'light':
          state = ThemeMode.light;
          break;
        case 'dark':
          state = ThemeMode.dark;
          break;
        default:
          state = ThemeMode.system;
      }
    } catch (e) {
      // Storage not initialized yet, use default
      state = ThemeMode.system;
    }
  }
  
  /// Set theme mode and persist to storage
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    
    String modeString;
    switch (mode) {
      case ThemeMode.light:
        modeString = 'light';
        break;
      case ThemeMode.dark:
        modeString = 'dark';
        break;
      case ThemeMode.system:
        modeString = 'system';
        break;
    }
    
    try {
      await LocalStorage.setThemeMode(modeString);
    } catch (e) {
      // Storage not initialized, ignore
    }
  }
  
  /// Toggle between light and dark mode
  /// If currently system, defaults to light
  Future<void> toggleTheme() async {
    final newMode = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await setThemeMode(newMode);
  }
  
  /// Check if dark mode is active
  bool isDarkMode(BuildContext context) {
    if (state == ThemeMode.system) {
      return MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    }
    return state == ThemeMode.dark;
  }
}

/// Provider for checking if dark mode is currently active
/// Takes into account system theme when ThemeMode.system is selected
final isDarkModeProvider = Provider.family<bool, BuildContext>(
  (ref, context) {
    final themeMode = ref.watch(themeModeProvider);
    if (themeMode == ThemeMode.system) {
      return MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    }
    return themeMode == ThemeMode.dark;
  },
);
