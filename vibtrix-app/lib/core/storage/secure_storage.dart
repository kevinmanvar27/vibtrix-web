/// Secure storage service for sensitive data (tokens, credentials)
/// Uses flutter_secure_storage for encrypted storage

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _fcmTokenKey = 'fcm_token';

  late final FlutterSecureStorage _storage;

  // Singleton instance
  static final SecureStorageService _instance = SecureStorageService._internal();
  
  factory SecureStorageService() => _instance;
  
  SecureStorageService._internal() {
    _storage = const FlutterSecureStorage(
      aOptions: AndroidOptions(
        encryptedSharedPreferences: true,
      ),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device,
      ),
    );
  }

  // ============================================================================
  // Generic Methods (for repository use)
  // ============================================================================

  /// Read a value from secure storage
  Future<String?> read(String key) async {
    return await _storage.read(key: key);
  }

  /// Write a value to secure storage
  Future<void> write(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  /// Delete a value from secure storage
  Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  // ============================================================================
  // Access Token
  // ============================================================================

  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _accessTokenKey, value: token);
  }

  Future<void> deleteAccessToken() async {
    await _storage.delete(key: _accessTokenKey);
  }

  // ============================================================================
  // Refresh Token
  // ============================================================================

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<void> deleteRefreshToken() async {
    await _storage.delete(key: _refreshTokenKey);
  }

  // Save both tokens at once
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      saveAccessToken(accessToken),
      saveRefreshToken(refreshToken),
    ]);
  }

  // Clear all tokens (logout)
  Future<void> clearTokens() async {
    await Future.wait([
      deleteAccessToken(),
      deleteRefreshToken(),
    ]);
  }

  // ============================================================================
  // User ID
  // ============================================================================

  Future<String?> getUserId() async {
    return await _storage.read(key: _userIdKey);
  }

  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }

  Future<void> deleteUserId() async {
    await _storage.delete(key: _userIdKey);
  }

  // ============================================================================
  // FCM Token
  // ============================================================================

  Future<String?> getFcmToken() async {
    return await _storage.read(key: _fcmTokenKey);
  }

  Future<void> saveFcmToken(String token) async {
    await _storage.write(key: _fcmTokenKey, value: token);
  }

  Future<void> deleteFcmToken() async {
    await _storage.delete(key: _fcmTokenKey);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // Clear all data (for account deletion)
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

/// Static convenience class for accessing secure storage
/// Use this for quick access without needing to create an instance
class SecureStorage {
  static final _service = SecureStorageService();
  
  // Generic methods
  static Future<String?> read(String key) => _service.read(key);
  static Future<void> write(String key, String value) => _service.write(key, value);
  static Future<void> delete(String key) => _service.delete(key);
  
  static Future<String?> getAccessToken() => _service.getAccessToken();
  static Future<void> saveAccessToken(String token) => _service.saveAccessToken(token);
  static Future<void> deleteAccessToken() => _service.deleteAccessToken();
  
  static Future<String?> getRefreshToken() => _service.getRefreshToken();
  static Future<void> saveRefreshToken(String token) => _service.saveRefreshToken(token);
  static Future<void> deleteRefreshToken() => _service.deleteRefreshToken();
  
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) => _service.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
  
  static Future<void> clearTokens() => _service.clearTokens();
  
  static Future<String?> getUserId() => _service.getUserId();
  static Future<void> saveUserId(String userId) => _service.saveUserId(userId);
  static Future<void> deleteUserId() => _service.deleteUserId();
  
  static Future<String?> getFcmToken() => _service.getFcmToken();
  static Future<void> saveFcmToken(String token) => _service.saveFcmToken(token);
  static Future<void> deleteFcmToken() => _service.deleteFcmToken();
  
  static Future<bool> isLoggedIn() => _service.isLoggedIn();
  static Future<void> clearAll() => _service.clearAll();
}
