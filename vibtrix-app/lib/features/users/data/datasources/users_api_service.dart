import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../models/users_models.dart';

part 'users_api_service.g.dart';

@RestApi()
abstract class UsersApiService {
  factory UsersApiService(Dio dio, {String baseUrl}) = _UsersApiService;

  @GET('/users/{userId}')
  Future<UserProfileModel> getUserProfile(@Path('userId') String userId);

  @GET('/users/username/{username}')
  Future<UserProfileModel> getUserByUsername(@Path('username') String username);

  /// Get recently joined users (suggested users)
  /// GET /api/users/recently-joined
  @GET('/users/recently-joined')
  Future<RecentlyJoinedResponse> getRecentlyJoinedUsers({
    @Query('limit') int limit = 10,
    @Query('page') int page = 1,
    @Query('onlineStatus') String? onlineStatus,
    @Query('gender') String? gender,
  });

  @GET('/users/search')
  Future<PaginatedResponse<SimpleUserModel>> searchUsers({
    @Query('q') required String query,
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @GET('/users/{userId}/posts')
  Future<PaginatedResponse<PostModel>> getUserPosts(
    @Path('userId') String userId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // Follow System
  @POST('/users/{userId}/followers')
  Future<FollowResponse> followUser(@Path('userId') String userId);

  @DELETE('/users/{userId}/followers')
  Future<void> unfollowUser(@Path('userId') String userId);

  @GET('/users/{userId}/followers/list')
  Future<PaginatedResponse<SimpleUserModel>> getFollowers(
    @Path('userId') String userId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @GET('/users/{userId}/following/list')
  Future<PaginatedResponse<SimpleUserModel>> getFollowing(
    @Path('userId') String userId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @GET('/users/{userId}/mutual-followers')
  Future<PaginatedResponse<SimpleUserModel>> getMutualFollowers(
    @Path('userId') String userId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @GET('/users/{userId}/follow-status')
  Future<FollowStatusResponse> checkFollowStatus(@Path('userId') String userId);

  // Follow Requests (for private accounts)
  @POST('/users/{userId}/follow-request')
  Future<void> sendFollowRequest(@Path('userId') String userId);

  /// Accept/Reject follow request using PATCH /users/follow-requests/{requestId}
  /// Body: { "action": "accept" } or { "action": "reject" }
  @PATCH('/users/follow-requests/{requestId}')
  Future<void> respondToFollowRequest(
    @Path('requestId') String requestId,
    @Body() FollowRequestActionRequest request,
  );

  @DELETE('/users/{userId}/follow-request')
  Future<void> cancelFollowRequest(@Path('userId') String userId);

  @GET('/users/follow-requests')
  Future<PaginatedResponse<SimpleUserModel>> getPendingFollowRequests({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // Note: DELETE /users/{userId}/follower (remove follower) does NOT exist in backend

  // Block
  @POST('/users/{userId}/block')
  Future<void> blockUser(@Path('userId') String userId);

  @DELETE('/users/{userId}/block')
  Future<void> unblockUser(@Path('userId') String userId);

  @GET('/users/blocked')
  Future<PaginatedResponse<SimpleUserModel>> getBlockedUsers({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // Note: /users/{userId}/block-status endpoint does NOT exist in backend
  // Use follow-status endpoint or check block list instead

  // Report
  @POST('/users/{userId}/report')
  Future<void> reportUser(
    @Path('userId') String userId,
    @Body() ReportUserRequest data,
  );
}
