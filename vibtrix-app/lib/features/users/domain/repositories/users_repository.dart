import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../../auth/data/models/user_model.dart';
import '../../data/models/users_models.dart';

/// Abstract repository interface for user operations
abstract class UsersRepository {
  /// Get user profile by ID
  Future<Result<UserProfileModel>> getUserProfile(String userId);

  /// Get user by username
  Future<Result<UserProfileModel>> getUserByUsername(String username);

  /// Follow a user
  Future<Result<void>> followUser(String userId);

  /// Unfollow a user
  Future<Result<void>> unfollowUser(String userId);

  /// Get user's followers
  Future<Result<PaginatedResponse<SimpleUserModel>>> getFollowers(
    String userId, {
    String? cursor,
    int limit = 20,
  });

  /// Get users that a user is following
  Future<Result<PaginatedResponse<SimpleUserModel>>> getFollowing(
    String userId, {
    String? cursor,
    int limit = 20,
  });

  /// Check if current user follows a user
  Future<Result<bool>> isFollowing(String userId);

  /// Get mutual followers
  Future<Result<PaginatedResponse<SimpleUserModel>>> getMutualFollowers(
    String userId, {
    String? cursor,
    int limit = 20,
  });

  /// Block a user
  Future<Result<void>> blockUser(String userId);

  /// Unblock a user
  Future<Result<void>> unblockUser(String userId);

  /// Get blocked users
  Future<Result<PaginatedResponse<SimpleUserModel>>> getBlockedUsers({
    String? cursor,
    int limit = 20,
  });

  /// Report a user
  Future<Result<void>> reportUser(String userId, String reason, String? description);

  /// Get recently joined users (suggested users)
  Future<Result<RecentlyJoinedResponse>> getRecentlyJoinedUsers({
    int limit = 10,
    int page = 1,
    String? onlineStatus,
    String? gender,
  });

  /// Search users
  Future<Result<PaginatedResponse<SimpleUserModel>>> searchUsers(
    String query, {
    String? cursor,
    int limit = 20,
  });

  /// Accept follow request (for private accounts)
  /// requestId is the ID of the follow request, not the user ID
  Future<Result<void>> acceptFollowRequest(String requestId);

  /// Reject follow request
  /// requestId is the ID of the follow request, not the user ID
  Future<Result<void>> rejectFollowRequest(String requestId);

  /// Get pending follow requests
  Future<Result<PaginatedResponse<SimpleUserModel>>> getPendingFollowRequests({
    String? cursor,
    int limit = 20,
  });
}
