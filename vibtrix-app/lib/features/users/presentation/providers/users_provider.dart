/// Users state management using Riverpod
/// Handles user profiles, following, followers, and recommendations
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../posts/data/models/post_model.dart';
import '../../domain/repositories/users_repository.dart';

// ============================================================================
// User Profile State
// ============================================================================

class UserProfileState {
  final UserProfileModel? user;
  final bool isLoading;
  final bool isFollowLoading;
  final String? errorMessage;

  const UserProfileState({
    this.user,
    this.isLoading = false,
    this.isFollowLoading = false,
    this.errorMessage,
  });

  UserProfileState copyWith({
    UserProfileModel? user,
    bool? isLoading,
    bool? isFollowLoading,
    String? errorMessage,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return UserProfileState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      isFollowLoading: isFollowLoading ?? this.isFollowLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// User Profile Notifier - Connected to Real API
// ============================================================================

class UserProfileNotifier extends StateNotifier<UserProfileState> {
  final UsersRepository _repository;
  final String userId;

  UserProfileNotifier(this._repository, this.userId) : super(const UserProfileState()) {
    loadUser();
  }

  /// Load user profile from real API
  Future<void> loadUser() async {
    debugPrint('[UserProfileProvider] 📱 Loading profile for user: $userId');
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.getUserProfile(userId);

    result.fold(
      (failure) {
        debugPrint('[UserProfileProvider] ❌ Failed: ${_getErrorMessage(failure)}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
      },
      (user) {
        debugPrint('[UserProfileProvider] ✅ Loaded profile: ${user.username}');
        state = state.copyWith(isLoading: false, user: user);
      },
    );
  }

  /// Toggle follow/unfollow with real API
  Future<void> toggleFollow() async {
    if (state.user == null) return;

    state = state.copyWith(isFollowLoading: true);

    final user = state.user!;
    final newIsFollowing = !(user.isFollowing ?? false);
    debugPrint('[UserProfileProvider] ${newIsFollowing ? "Following" : "Unfollowing"} user: $userId');

    // Optimistic update
    state = state.copyWith(
      user: user.copyWith(
        isFollowing: newIsFollowing,
        followersCount: user.followersCount + (newIsFollowing ? 1 : -1),
      ),
    );

    // Make API call
    final result = newIsFollowing
        ? await _repository.followUser(userId)
        : await _repository.unfollowUser(userId);

    result.fold(
      (failure) {
        debugPrint('[UserProfileProvider] ❌ Follow/Unfollow failed, reverting');
        // Revert on failure
        state = state.copyWith(
          isFollowLoading: false,
          user: user, // Restore original
          errorMessage: _getErrorMessage(failure),
        );
      },
      (_) {
        debugPrint('[UserProfileProvider] ✅ Follow/Unfollow successful');
        state = state.copyWith(isFollowLoading: false);
      },
    );
  }

  /// Block user with real API
  Future<bool> blockUser() async {
    if (state.user == null) return false;
    debugPrint('[UserProfileProvider] 🚫 Blocking user: $userId');

    final result = await _repository.blockUser(userId);

    return result.fold(
      (failure) {
        debugPrint('[UserProfileProvider] ❌ Block failed');
        return false;
      },
      (_) {
        debugPrint('[UserProfileProvider] ✅ User blocked');
        state = state.copyWith(
          user: state.user!.copyWith(isBlocked: true, isFollowing: false),
        );
        return true;
      },
    );
  }

  /// Unblock user with real API
  Future<bool> unblockUser() async {
    if (state.user == null) return false;
    debugPrint('[UserProfileProvider] ✅ Unblocking user: $userId');

    final result = await _repository.unblockUser(userId);

    return result.fold(
      (failure) {
        debugPrint('[UserProfileProvider] ❌ Unblock failed');
        return false;
      },
      (_) {
        debugPrint('[UserProfileProvider] ✅ User unblocked');
        state = state.copyWith(
          user: state.user!.copyWith(isBlocked: false),
        );
        return true;
      },
    );
  }

  /// Clear state
  void clear() {
    state = const UserProfileState();
  }

  String _getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return 'No internet connection';
    } else if (failure is ServerFailure) {
      return 'Server error. Please try again.';
    }
    return failure.message ?? 'Failed to load user';
  }
}

// ============================================================================
// Followers/Following List State
// ============================================================================

class UserListState {
  final List<SimpleUserModel> users;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;

  const UserListState({
    this.users = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
  });

  UserListState copyWith({
    List<SimpleUserModel>? users,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    bool clearError = false,
  }) {
    return UserListState(
      users: users ?? this.users,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// Followers Notifier - Connected to Real API
// ============================================================================

class FollowersNotifier extends StateNotifier<UserListState> {
  final UsersRepository _repository;
  final String userId;

  FollowersNotifier(this._repository, this.userId) : super(const UserListState()) {
    loadFollowers();
  }

  Future<void> loadFollowers({bool refresh = false}) async {
    if (state.isLoading) return;
    debugPrint('[FollowersProvider] 📱 Loading followers for user: $userId');

    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        users: [],
        cursor: null,
        hasMore: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    final result = await _repository.getFollowers(userId, limit: 20);

    result.fold(
      (failure) {
        debugPrint('[FollowersProvider] ❌ Failed: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load followers',
        );
      },
      (response) {
        debugPrint('[FollowersProvider] ✅ Loaded ${response.data.length} followers');
        state = state.copyWith(
          isLoading: false,
          users: response.data,
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    debugPrint('[FollowersProvider] 📱 Loading more followers...');

    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getFollowers(
      userId,
      cursor: state.cursor,
      limit: 20,
    );

    result.fold(
      (failure) {
        debugPrint('[FollowersProvider] ❌ Failed to load more');
        state = state.copyWith(isLoadingMore: false);
      },
      (response) {
        debugPrint('[FollowersProvider] ✅ Loaded ${response.data.length} more followers');
        state = state.copyWith(
          isLoadingMore: false,
          users: [...state.users, ...response.data],
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }
}

// ============================================================================
// Following Notifier - Connected to Real API
// ============================================================================

class FollowingNotifier extends StateNotifier<UserListState> {
  final UsersRepository _repository;
  final String userId;

  FollowingNotifier(this._repository, this.userId) : super(const UserListState()) {
    loadFollowing();
  }

  Future<void> loadFollowing({bool refresh = false}) async {
    if (state.isLoading) return;
    debugPrint('[FollowingProvider] 📱 Loading following for user: $userId');

    if (refresh) {
      state = state.copyWith(
        isLoading: true,
        users: [],
        cursor: null,
        hasMore: true,
        clearError: true,
      );
    } else {
      state = state.copyWith(isLoading: true, clearError: true);
    }

    final result = await _repository.getFollowing(userId, limit: 20);

    result.fold(
      (failure) {
        debugPrint('[FollowingProvider] ❌ Failed: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load following',
        );
      },
      (response) {
        debugPrint('[FollowingProvider] ✅ Loaded ${response.data.length} following');
        state = state.copyWith(
          isLoading: false,
          users: response.data,
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    debugPrint('[FollowingProvider] 📱 Loading more following...');

    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getFollowing(
      userId,
      cursor: state.cursor,
      limit: 20,
    );

    result.fold(
      (failure) {
        debugPrint('[FollowingProvider] ❌ Failed to load more');
        state = state.copyWith(isLoadingMore: false);
      },
      (response) {
        debugPrint('[FollowingProvider] ✅ Loaded ${response.data.length} more following');
        state = state.copyWith(
          isLoadingMore: false,
          users: [...state.users, ...response.data],
          cursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }
}

// ============================================================================
// Providers - Connected to Real API
// ============================================================================

/// User profile provider - family for different user IDs
final userProfileProvider =
    StateNotifierProvider.family<UserProfileNotifier, UserProfileState, String>(
  (ref, userId) {
    final repository = ref.watch(usersRepositoryProvider);
    return UserProfileNotifier(repository, userId);
  },
);

/// Current user provider - gets from auth state
final currentUserProvider = Provider<UserModel?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
});

/// User by username provider - real API
final userByUsernameProvider =
    FutureProvider.family<UserProfileModel?, String>((ref, username) async {
  debugPrint('[UserByUsernameProvider] 📱 Loading user by username: $username');
  final repository = ref.watch(usersRepositoryProvider);
  final result = await repository.getUserByUsername(username);
  return result.fold(
    (failure) {
      debugPrint('[UserByUsernameProvider] ❌ Failed: ${failure.message}');
      return null;
    },
    (user) {
      debugPrint('[UserByUsernameProvider] ✅ Found user: ${user.username}');
      return user;
    },
  );
});

/// Followers provider - real API
final followersProvider =
    StateNotifierProvider.family<FollowersNotifier, UserListState, String>(
  (ref, userId) {
    final repository = ref.watch(usersRepositoryProvider);
    return FollowersNotifier(repository, userId);
  },
);

/// Following provider - real API
final followingProvider =
    StateNotifierProvider.family<FollowingNotifier, UserListState, String>(
  (ref, userId) {
    final repository = ref.watch(usersRepositoryProvider);
    return FollowingNotifier(repository, userId);
  },
);

/// Suggested users provider - real API
/// NOTE: Backend does not have /users/suggested endpoint.
/// Using recently joined users as fallback.
final suggestedUsersProvider = FutureProvider<List<SimpleUserModel>>((ref) async {
  debugPrint('[SuggestedUsersProvider] 📱 Loading suggested users (using recently joined)...');
  final repository = ref.watch(usersRepositoryProvider);
  final result = await repository.getRecentlyJoinedUsers(limit: 10);
  return result.fold(
    (failure) {
      debugPrint('[SuggestedUsersProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[SuggestedUsersProvider] ✅ Loaded ${response.users.length} suggested users');
      return response.users;
    },
  );
});

/// Blocked users provider - real API
final blockedUsersProvider = FutureProvider<List<SimpleUserModel>>((ref) async {
  debugPrint('[BlockedUsersProvider] 📱 Loading blocked users...');
  final repository = ref.watch(usersRepositoryProvider);
  final result = await repository.getBlockedUsers();
  return result.fold(
    (failure) {
      debugPrint('[BlockedUsersProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[BlockedUsersProvider] ✅ Loaded ${response.data.length} blocked users');
      return response.data;
    },
  );
});

/// Mutual followers provider - real API
final mutualFollowersProvider =
    FutureProvider.family<List<SimpleUserModel>, String>((ref, userId) async {
  debugPrint('[MutualFollowersProvider] 📱 Loading mutual followers for: $userId');
  final repository = ref.watch(usersRepositoryProvider);
  final result = await repository.getMutualFollowers(userId);
  return result.fold(
    (failure) {
      debugPrint('[MutualFollowersProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[MutualFollowersProvider] ✅ Loaded ${response.data.length} mutual followers');
      return response.data;
    },
  );
});

/// Search users provider - real API
final searchUsersProvider =
    FutureProvider.family<List<SimpleUserModel>, String>((ref, query) async {
  if (query.isEmpty) return [];
  debugPrint('[SearchUsersProvider] 📱 Searching users: $query');
  final repository = ref.watch(usersRepositoryProvider);
  final result = await repository.searchUsers(query);
  return result.fold(
    (failure) {
      debugPrint('[SearchUsersProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[SearchUsersProvider] ✅ Found ${response.data.length} users');
      return response.data;
    },
  );
});

/// User posts provider - using posts repository
final userPostsProvider =
    FutureProvider.family<List<PostModel>, String>((ref, userId) async {
  debugPrint('[UserPostsProvider] 📱 Loading posts for user: $userId');
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getUserPosts(userId);
  return result.fold(
    (failure) {
      debugPrint('[UserPostsProvider] ❌ Failed: ${failure.message}');
      return [];
    },
    (response) {
      debugPrint('[UserPostsProvider] ✅ Loaded ${response.data.length} posts');
      return response.data;
    },
  );
});
