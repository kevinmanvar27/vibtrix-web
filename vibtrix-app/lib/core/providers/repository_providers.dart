/// Repository providers for all features
/// These providers create singleton instances of repository implementations

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core_providers.dart';
import 'service_providers.dart';

// Domain repositories (interfaces)
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/posts/domain/repositories/posts_repository.dart';
import '../../features/users/domain/repositories/users_repository.dart';
import '../../features/competitions/domain/repositories/competitions_repository.dart';
import '../../features/chat/domain/repositories/chat_repository.dart';
import '../../features/notifications/domain/repositories/notifications_repository.dart';
import '../../features/wallet/domain/repositories/wallet_repository.dart';
import '../../features/search/domain/repositories/search_repository.dart';
import '../../features/settings/domain/repositories/settings_repository.dart';
import '../../features/report/domain/repositories/report_repository.dart';
import '../../features/feedback/domain/repositories/feedback_repository.dart';
import '../../features/explore/domain/repositories/explore_repository.dart';

// Data repositories (implementations)
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/posts/data/repositories/posts_repository_impl.dart';
import '../../features/users/data/repositories/users_repository_impl.dart';
import '../../features/competitions/data/repositories/competitions_repository_impl.dart';
import '../../features/chat/data/repositories/chat_repository_impl.dart';
import '../../features/notifications/data/repositories/notifications_repository_impl.dart';
import '../../features/wallet/data/repositories/wallet_repository_impl.dart';
import '../../features/search/data/repositories/search_repository_impl.dart';
import '../../features/settings/data/repositories/settings_repository_impl.dart';
import '../../features/report/data/repositories/report_repository_impl.dart';
import '../../features/feedback/data/repositories/feedback_repository_impl.dart';
import '../../features/explore/data/repositories/explore_repository_impl.dart';

// ============================================================================
// Repository Providers
// ============================================================================

/// Auth repository provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiService = ref.watch(authApiServiceProvider);
  final uploadService = ref.watch(uploadApiServiceProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  return AuthRepositoryImpl(
    apiService: apiService,
    uploadService: uploadService,
    secureStorage: secureStorage,
  );
});

/// Posts repository provider
final postsRepositoryProvider = Provider<PostsRepository>((ref) {
  final apiService = ref.watch(postsApiServiceProvider);
  return PostsRepositoryImpl(apiService: apiService);
});

/// Users repository provider
final usersRepositoryProvider = Provider<UsersRepository>((ref) {
  final apiService = ref.watch(usersApiServiceProvider);
  return UsersRepositoryImpl(apiService: apiService);
});

/// Competitions repository provider
final competitionsRepositoryProvider = Provider<CompetitionsRepository>((ref) {
  final apiService = ref.watch(competitionsApiServiceProvider);
  return CompetitionsRepositoryImpl(apiService: apiService);
});

/// Chat repository provider
final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final apiService = ref.watch(chatApiServiceProvider);
  return ChatRepositoryImpl(apiService: apiService);
});

/// Notifications repository provider
final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  final apiService = ref.watch(notificationsApiServiceProvider);
  return NotificationsRepositoryImpl(apiService: apiService);
});

/// Wallet repository provider
final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  final apiService = ref.watch(walletApiServiceProvider);
  return WalletRepositoryImpl(apiService: apiService);
});

/// Search repository provider
final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final apiService = ref.watch(searchApiServiceProvider);
  return SearchRepositoryImpl(apiService: apiService);
});

/// Settings repository provider
final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  final apiService = ref.watch(settingsApiServiceProvider);
  final localStorage = ref.watch(localStorageProvider);
  return SettingsRepositoryImpl(apiService: apiService, localStorage: localStorage);
});

/// Report repository provider
final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  final apiService = ref.watch(reportApiServiceProvider);
  return ReportRepositoryImpl(apiService: apiService);
});

/// Feedback repository provider
final feedbackRepositoryProvider = Provider<FeedbackRepository>((ref) {
  final apiService = ref.watch(feedbackApiServiceProvider);
  final localStorage = ref.watch(localStorageProvider);
  return FeedbackRepositoryImpl(apiService: apiService, localStorage: localStorage);
});

/// Explore repository provider
final exploreRepositoryProvider = Provider<ExploreRepository>((ref) {
  final apiService = ref.watch(exploreApiServiceProvider);
  return ExploreRepositoryImpl(apiService);
});
