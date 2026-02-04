import '../../../../core/utils/either.dart';
import 'package:flutter/material.dart' show ThemeMode;
import '../../../../core/error/failures.dart';
import '../../data/models/settings_model.dart';
import '../../data/datasources/settings_api_service.dart' show UpdatePrivacySettingsRequest;

/// Abstract repository for settings operations
abstract class SettingsRepository {
  // App config
  Future<Result<AppConfigModel>> getAppConfig();
  Future<Result<bool>> checkForUpdates();
  Future<Result<AppVersionModel>> getLatestVersion();
  
  // Privacy settings
  Future<Result<PrivacySettingsModel>> getPrivacySettings();
  Future<Result<void>> updatePrivacySettings(UpdatePrivacySettingsRequest request);
  
  // Account settings
  Future<Result<AccountSettingsModel>> getAccountSettings();
  Future<Result<void>> updateAccountSettings(UpdateAccountSettingsRequest request);
  
  // Content preferences
  Future<Result<ContentPreferencesModel>> getContentPreferences();
  Future<Result<void>> updateContentPreferences(UpdateContentPreferencesRequest request);
  
  // Language & Region
  Future<Result<List<LanguageModel>>> getAvailableLanguages();
  Future<Result<void>> setLanguage(String languageCode);
  Future<Result<String>> getCurrentLanguage();
  
  // Theme
  Future<Result<ThemeMode>> getThemeMode();
  Future<Result<void>> setThemeMode(ThemeMode mode);
  
  // Data & Storage
  Future<Result<DataUsageModel>> getDataUsage();
  Future<Result<void>> clearCache();
  Future<Result<void>> clearDownloads();
  Future<Result<StorageInfoModel>> getStorageInfo();
  
  // Account management
  Future<Result<void>> deactivateAccount();
  Future<Result<void>> deleteAccount(String password);
  Future<Result<void>> downloadMyData();
  
  // Security
  Future<Result<SecuritySettingsModel>> getSecuritySettings();
  Future<Result<void>> updateSecuritySettings(UpdateSecuritySettingsRequest request);
  Future<Result<List<ActiveSessionModel>>> getActiveSessions();
  Future<Result<void>> terminateSession(String sessionId);
  Future<Result<void>> terminateAllOtherSessions();
  
  // Two-factor authentication
  Future<Result<TwoFactorSetupModel>> setupTwoFactor();
  Future<Result<void>> enableTwoFactor(String code);
  Future<Result<void>> disableTwoFactor(String code);
  Future<Result<bool>> isTwoFactorEnabled();
  
  // Help & Support
  Future<Result<List<FaqModel>>> getFaqs();
  Future<Result<List<FaqCategoryModel>>> getFaqCategories();
  Future<Result<ContactInfoModel>> getContactInfo();
  
  // Legal
  Future<Result<String>> getTermsOfService();
  Future<Result<String>> getPrivacyPolicy();
  Future<Result<String>> getCommunityGuidelines();
}
