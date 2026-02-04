/// Settings Provider
/// Handles app settings, privacy, notifications, and account preferences

import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/settings_model.dart';
import '../../data/datasources/settings_api_service.dart' show UpdatePrivacySettingsRequest;
import '../../domain/repositories/settings_repository.dart';

// ============================================================================
// Settings State
// ============================================================================

class SettingsState {
  final AppConfigModel? appConfig;
  final PrivacySettingsModel? privacySettings;
  final AccountSettingsModel? accountSettings;
  final SecuritySettingsModel? securitySettings;
  final ContentPreferencesModel? contentPreferences;
  final ThemeMode themeMode;
  final String currentLanguage;
  final bool isLoading;
  final bool isSaving;
  final String? errorMessage;
  final String? successMessage;

  const SettingsState({
    this.appConfig,
    this.privacySettings,
    this.accountSettings,
    this.securitySettings,
    this.contentPreferences,
    this.themeMode = ThemeMode.system,
    this.currentLanguage = 'en',
    this.isLoading = false,
    this.isSaving = false,
    this.errorMessage,
    this.successMessage,
  });

  SettingsState copyWith({
    AppConfigModel? appConfig,
    PrivacySettingsModel? privacySettings,
    AccountSettingsModel? accountSettings,
    SecuritySettingsModel? securitySettings,
    ContentPreferencesModel? contentPreferences,
    ThemeMode? themeMode,
    String? currentLanguage,
    bool? isLoading,
    bool? isSaving,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return SettingsState(
      appConfig: appConfig ?? this.appConfig,
      privacySettings: privacySettings ?? this.privacySettings,
      accountSettings: accountSettings ?? this.accountSettings,
      securitySettings: securitySettings ?? this.securitySettings,
      contentPreferences: contentPreferences ?? this.contentPreferences,
      themeMode: themeMode ?? this.themeMode,
      currentLanguage: currentLanguage ?? this.currentLanguage,
      isLoading: isLoading ?? this.isLoading,
      isSaving: isSaving ?? this.isSaving,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage:
          clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

// ============================================================================
// Settings Notifier
// ============================================================================

class SettingsNotifier extends StateNotifier<SettingsState> {
  final SettingsRepository _repository;

  SettingsNotifier(this._repository) : super(const SettingsState()) {
    loadSettings();
  }

  /// Load all settings
  Future<void> loadSettings() async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.getAppConfig();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load settings',
        );
      },
      (config) {
        state = state.copyWith(
          isLoading: false,
          appConfig: config,
        );
      },
    );

    // Load other settings in parallel
    await Future.wait([
      loadPrivacySettings(),
      loadAccountSettings(),
      loadSecuritySettings(),
      loadContentPreferences(),
      loadThemeMode(),
      loadCurrentLanguage(),
    ]);
  }

  /// Load privacy settings
  Future<void> loadPrivacySettings() async {
    final result = await _repository.getPrivacySettings();

    result.fold(
      (failure) {},
      (privacy) {
        state = state.copyWith(privacySettings: privacy);
      },
    );
  }

  /// Load account settings
  Future<void> loadAccountSettings() async {
    final result = await _repository.getAccountSettings();

    result.fold(
      (failure) {},
      (account) {
        state = state.copyWith(accountSettings: account);
      },
    );
  }

  /// Load security settings
  Future<void> loadSecuritySettings() async {
    final result = await _repository.getSecuritySettings();

    result.fold(
      (failure) {},
      (security) {
        state = state.copyWith(securitySettings: security);
      },
    );
  }

  /// Load content preferences
  Future<void> loadContentPreferences() async {
    final result = await _repository.getContentPreferences();

    result.fold(
      (failure) {},
      (prefs) {
        state = state.copyWith(contentPreferences: prefs);
      },
    );
  }

  /// Load theme mode
  Future<void> loadThemeMode() async {
    final result = await _repository.getThemeMode();

    result.fold(
      (failure) {},
      (mode) {
        state = state.copyWith(themeMode: mode);
      },
    );
  }

  /// Load current language
  Future<void> loadCurrentLanguage() async {
    final result = await _repository.getCurrentLanguage();

    result.fold(
      (failure) {},
      (language) {
        state = state.copyWith(currentLanguage: language);
      },
    );
  }

  /// Update privacy settings
  Future<bool> updatePrivacySettings(UpdatePrivacySettingsRequest request) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.updatePrivacySettings(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to save privacy settings',
        );
        return false;
      },
      (_) {
        // Reload privacy settings to get updated values
        loadPrivacySettings();
        state = state.copyWith(
          isSaving: false,
          successMessage: 'Privacy settings saved',
        );
        return true;
      },
    );
  }

  /// Update account settings
  Future<bool> updateAccountSettings(UpdateAccountSettingsRequest request) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.updateAccountSettings(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to save account settings',
        );
        return false;
      },
      (_) {
        loadAccountSettings();
        state = state.copyWith(
          isSaving: false,
          successMessage: 'Account settings saved',
        );
        return true;
      },
    );
  }

  /// Update security settings
  Future<bool> updateSecuritySettings(UpdateSecuritySettingsRequest request) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.updateSecuritySettings(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to save security settings',
        );
        return false;
      },
      (_) {
        loadSecuritySettings();
        state = state.copyWith(
          isSaving: false,
          successMessage: 'Security settings saved',
        );
        return true;
      },
    );
  }

  /// Update content preferences
  Future<bool> updateContentPreferences(UpdateContentPreferencesRequest request) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.updateContentPreferences(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to save content preferences',
        );
        return false;
      },
      (_) {
        loadContentPreferences();
        state = state.copyWith(
          isSaving: false,
          successMessage: 'Content preferences saved',
        );
        return true;
      },
    );
  }

  /// Change language
  Future<bool> changeLanguage(String languageCode) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.setLanguage(languageCode);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to change language',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isSaving: false,
          currentLanguage: languageCode,
          successMessage: 'Language changed',
        );
        return true;
      },
    );
  }

  /// Change theme
  Future<bool> changeTheme(ThemeMode mode) async {
    state = state.copyWith(isSaving: true, clearError: true, clearSuccess: true);

    final result = await _repository.setThemeMode(mode);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSaving: false,
          errorMessage: failure.message ?? 'Failed to change theme',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isSaving: false,
          themeMode: mode,
          successMessage: 'Theme changed',
        );
        return true;
      },
    );
  }

  /// Clear messages
  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

// ============================================================================
// Account Settings State
// ============================================================================

class AccountSettingsState {
  final bool isLoading;
  final bool isProcessing;
  final String? errorMessage;
  final String? successMessage;

  const AccountSettingsState({
    this.isLoading = false,
    this.isProcessing = false,
    this.errorMessage,
    this.successMessage,
  });

  AccountSettingsState copyWith({
    bool? isLoading,
    bool? isProcessing,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return AccountSettingsState(
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage:
          clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

// ============================================================================
// Account Settings Notifier
// ============================================================================

class AccountSettingsNotifier extends StateNotifier<AccountSettingsState> {
  final SettingsRepository _repository;

  AccountSettingsNotifier(this._repository)
      : super(const AccountSettingsState());

  /// Deactivate account
  Future<bool> deactivateAccount() async {
    state = state.copyWith(
        isProcessing: true, clearError: true, clearSuccess: true);

    final result = await _repository.deactivateAccount();

    return result.fold(
      (failure) {
        state = state.copyWith(
          isProcessing: false,
          errorMessage: failure.message ?? 'Failed to deactivate account',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isProcessing: false,
          successMessage: 'Account deactivated',
        );
        return true;
      },
    );
  }

  /// Delete account
  Future<bool> deleteAccount(String password) async {
    state = state.copyWith(
        isProcessing: true, clearError: true, clearSuccess: true);

    final result = await _repository.deleteAccount(password);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isProcessing: false,
          errorMessage: failure.message ?? 'Failed to delete account',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isProcessing: false,
          successMessage: 'Account deleted',
        );
        return true;
      },
    );
  }

  /// Download my data
  Future<bool> downloadMyData() async {
    state = state.copyWith(
        isProcessing: true, clearError: true, clearSuccess: true);

    final result = await _repository.downloadMyData();

    return result.fold(
      (failure) {
        state = state.copyWith(
          isProcessing: false,
          errorMessage: failure.message ?? 'Failed to request data export',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isProcessing: false,
          successMessage: 'Data export requested. You will receive an email when ready.',
        );
        return true;
      },
    );
  }

  /// Clear messages
  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

// ============================================================================
// Providers
// ============================================================================

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  final repository = ref.watch(settingsRepositoryProvider);
  return SettingsNotifier(repository);
});

final accountSettingsProvider =
    StateNotifierProvider<AccountSettingsNotifier, AccountSettingsState>((ref) {
  final repository = ref.watch(settingsRepositoryProvider);
  return AccountSettingsNotifier(repository);
});
