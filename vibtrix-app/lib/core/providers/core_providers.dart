/// Core Riverpod providers for app-wide services

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibtrix/core/network/connectivity_service.dart';
import 'package:vibtrix/core/network/dio_client.dart';
import 'package:vibtrix/core/storage/local_storage.dart';
import 'package:vibtrix/core/storage/secure_storage.dart';

/// Secure storage provider
final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

/// Local storage provider
/// Note: LocalStorageService.init() must be called at app startup before using this provider
final localStorageProvider = Provider<LocalStorageService>((ref) {
  return LocalStorageService();
});

/// DIO client provider
final dioClientProvider = Provider<DioClient>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return DioClient(secureStorage: secureStorage);
});

/// Connectivity service provider
final connectivityProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Connection status stream provider
final connectionStatusProvider = StreamProvider<ConnectionStatus>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.statusStream;
});

/// Is online provider
final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.isOnline;
});

// Note: Theme mode provider is defined in features/settings/presentation/providers/theme_provider.dart
// to avoid circular dependencies and keep feature-specific logic in the feature module
