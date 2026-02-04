/// Local storage service for non-sensitive data (preferences, cache)
/// Uses shared_preferences for simple key-value storage

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static const _themeKey = 'theme_mode';
  static const _onboardingCompleteKey = 'onboarding_complete';
  static const _lastFeedRefreshKey = 'last_feed_refresh';
  static const _notificationsEnabledKey = 'notifications_enabled';
  static const _autoplayVideosKey = 'autoplay_videos';
  static const _dataSaverModeKey = 'data_saver_mode';
  static const _languageKey = 'language';
  static const _feedFilterKey = 'feed_filter';
  static const _searchHistoryKey = 'search_history';
  static const _recentUsersKey = 'recent_users';
  static const _draftPostKey = 'draft_post';

  static LocalStorageService? _instance;
  static SharedPreferences? _prefs;
  
  LocalStorageService._internal();
  
  /// Factory constructor that returns the singleton instance
  factory LocalStorageService() {
    _instance ??= LocalStorageService._internal();
    return _instance!;
  }
  
  /// Async initialization - call this at app startup
  static Future<LocalStorageService> getInstance() async {
    _instance ??= LocalStorageService._internal();
    _prefs ??= await SharedPreferences.getInstance();
    return _instance!;
  }

  /// Initialize the service - must be called before using storage methods
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }
  
  /// Check if the service is initialized
  bool get isInitialized => _prefs != null;

  void _ensureInitialized() {
    if (_prefs == null) {
      throw StateError('LocalStorageService not initialized. Call init() first.');
    }
  }

  // Theme Mode
  String? getThemeMode() {
    _ensureInitialized();
    return _prefs!.getString(_themeKey);
  }

  Future<bool> setThemeMode(String mode) {
    _ensureInitialized();
    return _prefs!.setString(_themeKey, mode);
  }

  // Onboarding
  bool isOnboardingComplete() {
    _ensureInitialized();
    return _prefs!.getBool(_onboardingCompleteKey) ?? false;
  }

  Future<bool> setOnboardingComplete(bool complete) {
    _ensureInitialized();
    return _prefs!.setBool(_onboardingCompleteKey, complete);
  }

  // Last Feed Refresh
  DateTime? getLastFeedRefresh() {
    _ensureInitialized();
    final timestamp = _prefs!.getInt(_lastFeedRefreshKey);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  Future<bool> setLastFeedRefresh(DateTime time) {
    _ensureInitialized();
    return _prefs!.setInt(_lastFeedRefreshKey, time.millisecondsSinceEpoch);
  }

  // Notifications
  bool areNotificationsEnabled() {
    _ensureInitialized();
    return _prefs!.getBool(_notificationsEnabledKey) ?? true;
  }

  Future<bool> setNotificationsEnabled(bool enabled) {
    _ensureInitialized();
    return _prefs!.setBool(_notificationsEnabledKey, enabled);
  }

  // Autoplay Videos
  bool isAutoplayEnabled() {
    _ensureInitialized();
    return _prefs!.getBool(_autoplayVideosKey) ?? true;
  }

  Future<bool> setAutoplayEnabled(bool enabled) {
    _ensureInitialized();
    return _prefs!.setBool(_autoplayVideosKey, enabled);
  }

  // Data Saver Mode
  bool isDataSaverEnabled() {
    _ensureInitialized();
    return _prefs!.getBool(_dataSaverModeKey) ?? false;
  }

  Future<bool> setDataSaverEnabled(bool enabled) {
    _ensureInitialized();
    return _prefs!.setBool(_dataSaverModeKey, enabled);
  }

  // Language
  String getLanguage() {
    _ensureInitialized();
    return _prefs!.getString(_languageKey) ?? 'en';
  }

  Future<bool> setLanguage(String languageCode) {
    _ensureInitialized();
    return _prefs!.setString(_languageKey, languageCode);
  }

  // Feed Filter
  String getFeedFilter() {
    _ensureInitialized();
    return _prefs!.getString(_feedFilterKey) ?? 'all';
  }

  Future<bool> setFeedFilter(String filter) {
    _ensureInitialized();
    return _prefs!.setString(_feedFilterKey, filter);
  }

  // Search History
  List<String> getSearchHistory() {
    _ensureInitialized();
    return _prefs!.getStringList(_searchHistoryKey) ?? [];
  }

  Future<bool> addToSearchHistory(String query) {
    _ensureInitialized();
    final history = getSearchHistory();
    history.remove(query);
    history.insert(0, query);
    if (history.length > 20) {
      history.removeLast();
    }
    return _prefs!.setStringList(_searchHistoryKey, history);
  }

  Future<bool> removeFromSearchHistory(String query) {
    _ensureInitialized();
    final history = getSearchHistory();
    history.remove(query);
    return _prefs!.setStringList(_searchHistoryKey, history);
  }

  Future<bool> clearSearchHistory() {
    _ensureInitialized();
    return _prefs!.remove(_searchHistoryKey);
  }

  // Recent Users (for mentions, DMs)
  List<String> getRecentUsers() {
    _ensureInitialized();
    return _prefs!.getStringList(_recentUsersKey) ?? [];
  }

  Future<bool> addRecentUser(String userId) {
    _ensureInitialized();
    final users = getRecentUsers();
    users.remove(userId);
    users.insert(0, userId);
    if (users.length > 10) {
      users.removeLast();
    }
    return _prefs!.setStringList(_recentUsersKey, users);
  }

  // Draft Post (JSON encoded)
  Map<String, dynamic>? getDraftPost() {
    _ensureInitialized();
    final draft = _prefs!.getString(_draftPostKey);
    if (draft == null) return null;
    try {
      return jsonDecode(draft) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<bool> saveDraftPost(Map<String, dynamic> draft) {
    _ensureInitialized();
    return _prefs!.setString(_draftPostKey, jsonEncode(draft));
  }

  Future<bool> clearDraftPost() {
    _ensureInitialized();
    return _prefs!.remove(_draftPostKey);
  }

  // Generic methods
  Future<bool> setString(String key, String value) {
    _ensureInitialized();
    return _prefs!.setString(key, value);
  }

  String? getString(String key) {
    _ensureInitialized();
    return _prefs!.getString(key);
  }

  Future<bool> setBool(String key, bool value) {
    _ensureInitialized();
    return _prefs!.setBool(key, value);
  }

  bool? getBool(String key) {
    _ensureInitialized();
    return _prefs!.getBool(key);
  }

  Future<bool> setInt(String key, int value) {
    _ensureInitialized();
    return _prefs!.setInt(key, value);
  }

  int? getInt(String key) {
    _ensureInitialized();
    return _prefs!.getInt(key);
  }

  Future<bool> setDouble(String key, double value) {
    _ensureInitialized();
    return _prefs!.setDouble(key, value);
  }

  double? getDouble(String key) {
    _ensureInitialized();
    return _prefs!.getDouble(key);
  }

  Future<bool> setStringList(String key, List<String> value) {
    _ensureInitialized();
    return _prefs!.setStringList(key, value);
  }

  List<String>? getStringList(String key) {
    _ensureInitialized();
    return _prefs!.getStringList(key);
  }

  Future<bool> remove(String key) {
    _ensureInitialized();
    return _prefs!.remove(key);
  }

  Future<bool> clear() {
    _ensureInitialized();
    return _prefs!.clear();
  }

  bool containsKey(String key) {
    _ensureInitialized();
    return _prefs!.containsKey(key);
  }
}

/// Static convenience class for accessing local storage
/// Use this for quick access without needing to create an instance
class LocalStorage {
  static LocalStorageService? _service;
  
  static Future<void> init() async {
    _service = await LocalStorageService.getInstance();
  }
  
  static void _ensureInitialized() {
    if (_service == null) {
      throw StateError('LocalStorage not initialized. Call LocalStorage.init() first.');
    }
  }
  
  static String? getThemeMode() {
    _ensureInitialized();
    return _service!.getThemeMode();
  }
  
  static Future<bool> setThemeMode(String mode) {
    _ensureInitialized();
    return _service!.setThemeMode(mode);
  }
  
  static bool isOnboardingComplete() {
    _ensureInitialized();
    return _service!.isOnboardingComplete();
  }
  
  static Future<bool> setOnboardingComplete(bool complete) {
    _ensureInitialized();
    return _service!.setOnboardingComplete(complete);
  }
  
  static DateTime? getLastFeedRefresh() {
    _ensureInitialized();
    return _service!.getLastFeedRefresh();
  }
  
  static Future<bool> setLastFeedRefresh(DateTime time) {
    _ensureInitialized();
    return _service!.setLastFeedRefresh(time);
  }
  
  static bool areNotificationsEnabled() {
    _ensureInitialized();
    return _service!.areNotificationsEnabled();
  }
  
  static Future<bool> setNotificationsEnabled(bool enabled) {
    _ensureInitialized();
    return _service!.setNotificationsEnabled(enabled);
  }
  
  static bool isAutoplayEnabled() {
    _ensureInitialized();
    return _service!.isAutoplayEnabled();
  }
  
  static Future<bool> setAutoplayEnabled(bool enabled) {
    _ensureInitialized();
    return _service!.setAutoplayEnabled(enabled);
  }
  
  static bool isDataSaverEnabled() {
    _ensureInitialized();
    return _service!.isDataSaverEnabled();
  }
  
  static Future<bool> setDataSaverEnabled(bool enabled) {
    _ensureInitialized();
    return _service!.setDataSaverEnabled(enabled);
  }
  
  static String getLanguage() {
    _ensureInitialized();
    return _service!.getLanguage();
  }
  
  static Future<bool> setLanguage(String languageCode) {
    _ensureInitialized();
    return _service!.setLanguage(languageCode);
  }
  
  static String getFeedFilter() {
    _ensureInitialized();
    return _service!.getFeedFilter();
  }
  
  static Future<bool> setFeedFilter(String filter) {
    _ensureInitialized();
    return _service!.setFeedFilter(filter);
  }
  
  static List<String> getSearchHistory() {
    _ensureInitialized();
    return _service!.getSearchHistory();
  }
  
  static Future<bool> addToSearchHistory(String query) {
    _ensureInitialized();
    return _service!.addToSearchHistory(query);
  }
  
  static Future<bool> removeFromSearchHistory(String query) {
    _ensureInitialized();
    return _service!.removeFromSearchHistory(query);
  }
  
  static Future<bool> clearSearchHistory() {
    _ensureInitialized();
    return _service!.clearSearchHistory();
  }
  
  static List<String> getRecentUsers() {
    _ensureInitialized();
    return _service!.getRecentUsers();
  }
  
  static Future<bool> addRecentUser(String userId) {
    _ensureInitialized();
    return _service!.addRecentUser(userId);
  }
  
  static Map<String, dynamic>? getDraftPost() {
    _ensureInitialized();
    return _service!.getDraftPost();
  }
  
  static Future<bool> saveDraftPost(Map<String, dynamic> draft) {
    _ensureInitialized();
    return _service!.saveDraftPost(draft);
  }
  
  static Future<bool> clearDraftPost() {
    _ensureInitialized();
    return _service!.clearDraftPost();
  }
  
  static Future<bool> clear() {
    _ensureInitialized();
    return _service!.clear();
  }
}
