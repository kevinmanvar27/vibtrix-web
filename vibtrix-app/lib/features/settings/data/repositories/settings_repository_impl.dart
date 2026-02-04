import 'package:dio/dio.dart';
import 'package:flutter/material.dart' show ThemeMode;
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/storage/local_storage.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_api_service.dart';
import '../models/settings_model.dart';

/// Implementation of SettingsRepository
class SettingsRepositoryImpl implements SettingsRepository {
  final SettingsApiService _apiService;
  final LocalStorageService _localStorage;

  SettingsRepositoryImpl({
    required SettingsApiService apiService,
    required LocalStorageService localStorage,
  })  : _apiService = apiService,
        _localStorage = localStorage;

  @override
  Future<Result<AppConfigModel>> getAppConfig() async {
    try {
      final config = await _apiService.getAppConfig();
      return Right(config);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> checkForUpdates() async {
    try {
      final response = await _apiService.checkForUpdates();
      return Right(response.updateAvailable);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<AppVersionModel>> getLatestVersion() async {
    try {
      final version = await _apiService.getLatestVersion();
      return Right(version);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PrivacySettingsModel>> getPrivacySettings() async {
    try {
      final settings = await _apiService.getPrivacySettings();
      return Right(settings);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> updatePrivacySettings(UpdatePrivacySettingsRequest request) async {
    try {
      await _apiService.updatePrivacySettings(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<AccountSettingsModel>> getAccountSettings() async {
    try {
      final settings = await _apiService.getAccountSettings();
      return Right(settings);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> updateAccountSettings(UpdateAccountSettingsRequest request) async {
    try {
      await _apiService.updateAccountSettings(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ContentPreferencesModel>> getContentPreferences() async {
    try {
      final prefs = await _apiService.getContentPreferences();
      return Right(prefs);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> updateContentPreferences(UpdateContentPreferencesRequest request) async {
    try {
      await _apiService.updateContentPreferences(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<LanguageModel>>> getAvailableLanguages() async {
    try {
      final languages = await _apiService.getAvailableLanguages();
      return Right(languages);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> setLanguage(String languageCode) async {
    try {
      await _apiService.setLanguage(SetLanguageRequest(languageCode: languageCode));
      await _localStorage.setString('language', languageCode);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<String>> getCurrentLanguage() async {
    try {
      final language = _localStorage.getString('language') ?? 'en';
      return Right(language);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ThemeMode>> getThemeMode() async {
    try {
      final themeStr = _localStorage.getString('theme_mode') ?? 'system';
      final mode = ThemeMode.values.firstWhere(
        (m) => m.name == themeStr,
        orElse: () => ThemeMode.system,
      );
      return Right(mode);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> setThemeMode(ThemeMode mode) async {
    try {
      await _localStorage.setString('theme_mode', mode.name);
      return const Right(null);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<DataUsageModel>> getDataUsage() async {
    try {
      final usage = await _apiService.getDataUsage();
      return Right(usage);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> clearCache() async {
    try {
      await _localStorage.clear();
      return const Right(null);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> clearDownloads() async {
    try {
      // Clear downloaded files from local storage
      await _apiService.clearDownloads();
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<StorageInfoModel>> getStorageInfo() async {
    try {
      final info = await _apiService.getStorageInfo();
      return Right(info);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deactivateAccount() async {
    try {
      // Deactivate without password - API will handle authentication
      await _apiService.deactivateAccount(DeactivateAccountRequest(password: ''));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteAccount(String password) async {
    try {
      await _apiService.deleteAccount(DeleteAccountRequest(password: password, confirmDeletion: true));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> downloadMyData() async {
    try {
      await _apiService.requestDataExport();
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<SecuritySettingsModel>> getSecuritySettings() async {
    try {
      final settings = await _apiService.getSecuritySettings();
      return Right(settings);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> updateSecuritySettings(UpdateSecuritySettingsRequest request) async {
    try {
      await _apiService.updateSecuritySettings(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<ActiveSessionModel>>> getActiveSessions() async {
    try {
      final sessions = await _apiService.getActiveSessions();
      // Map SessionModel to ActiveSessionModel
      final activeSessions = sessions.map((s) => ActiveSessionModel(
        id: s.id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        location: s.location,
        ipAddress: s.ipAddress,
        lastActive: s.lastActiveAt,
        isCurrent: s.isCurrent,
      )).toList();
      return Right(activeSessions);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> terminateSession(String sessionId) async {
    try {
      await _apiService.revokeSession(sessionId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> terminateAllOtherSessions() async {
    try {
      await _apiService.revokeAllSessions();
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<TwoFactorSetupModel>> setupTwoFactor() async {
    try {
      final setup = await _apiService.setupTwoFactor();
      return Right(setup);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> enableTwoFactor(String code) async {
    try {
      await _apiService.enableTwoFactor(TwoFactorCodeRequest(code: code));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> disableTwoFactor(String code) async {
    try {
      await _apiService.disableTwoFactor(TwoFactorCodeRequest(code: code));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> isTwoFactorEnabled() async {
    try {
      final settings = await _apiService.getSecuritySettings();
      return Right(settings.twoFactorEnabled);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<FaqModel>>> getFaqs() async {
    try {
      final faqs = await _apiService.getFaqs();
      return Right(faqs);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<FaqCategoryModel>>> getFaqCategories() async {
    try {
      final categories = await _apiService.getFaqCategories();
      return Right(categories);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ContactInfoModel>> getContactInfo() async {
    try {
      final info = await _apiService.getContactInfo();
      return Right(info);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<String>> getTermsOfService() async {
    try {
      final response = await _apiService.getTermsOfService();
      return Right(response.content);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<String>> getPrivacyPolicy() async {
    try {
      final response = await _apiService.getPrivacyPolicy();
      return Right(response.content);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<String>> getCommunityGuidelines() async {
    try {
      final response = await _apiService.getCommunityGuidelines();
      return Right(response.content);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
