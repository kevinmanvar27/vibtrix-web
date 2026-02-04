/// API Service providers for all features
/// These providers create singleton instances of Retrofit API services

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core_providers.dart';

// Auth
import '../../features/auth/data/datasources/auth_api_service.dart';

// Posts
import '../../features/posts/data/datasources/posts_api_service.dart';

// Users
import '../../features/users/data/datasources/users_api_service.dart';

// Competitions
import '../../features/competitions/data/datasources/competitions_api_service.dart';

// Chat
import '../../features/chat/data/datasources/chat_api_service.dart';

// Notifications
import '../../features/notifications/data/datasources/notifications_api_service.dart';

// Wallet
import '../../features/wallet/data/datasources/wallet_api_service.dart';

// Search
import '../../features/search/data/datasources/search_api_service.dart';

// Settings
import '../../features/settings/data/datasources/settings_api_service.dart';

// Report
import '../../features/report/data/datasources/report_api_service.dart';

// Feedback
import '../../features/feedback/data/datasources/feedback_api_service.dart';

// Explore
import '../../features/explore/data/datasources/explore_api_service.dart';

// Upload (core)
import '../network/upload_api_service.dart';

// ============================================================================
// API Service Providers
// ============================================================================

/// Auth API service provider
final authApiServiceProvider = Provider<AuthApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AuthApiService(dioClient.dio);
});

/// Posts API service provider
final postsApiServiceProvider = Provider<PostsApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return PostsApiService(dioClient.dio);
});

/// Users API service provider
final usersApiServiceProvider = Provider<UsersApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return UsersApiService(dioClient.dio);
});

/// Competitions API service provider
final competitionsApiServiceProvider = Provider<CompetitionsApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return CompetitionsApiService(dioClient.dio);
});

/// Chat API service provider
final chatApiServiceProvider = Provider<ChatApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return ChatApiService(dioClient.dio);
});

/// Notifications API service provider
final notificationsApiServiceProvider = Provider<NotificationsApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return NotificationsApiService(dioClient.dio);
});

/// Wallet API service provider
final walletApiServiceProvider = Provider<WalletApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return WalletApiService(dioClient.dio);
});

/// Search API service provider
final searchApiServiceProvider = Provider<SearchApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return SearchApiService(dioClient.dio);
});

/// Settings API service provider
final settingsApiServiceProvider = Provider<SettingsApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return SettingsApiService(dioClient.dio);
});

/// Report API service provider
final reportApiServiceProvider = Provider<ReportApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return ReportApiService(dioClient.dio);
});

/// Feedback API service provider
final feedbackApiServiceProvider = Provider<FeedbackApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return FeedbackApiService(dioClient.dio);
});

/// Explore API service provider
final exploreApiServiceProvider = Provider<ExploreApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return ExploreApiService(dioClient.dio);
});

/// Upload API service provider
final uploadApiServiceProvider = Provider<UploadApiService>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return UploadApiService(dioClient.dio);
});
