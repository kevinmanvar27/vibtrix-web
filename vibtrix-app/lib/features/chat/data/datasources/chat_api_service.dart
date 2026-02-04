import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../models/chat_model.dart';

part 'chat_api_service.g.dart';

@RestApi()
abstract class ChatApiService {
  factory ChatApiService(Dio dio, {String baseUrl}) = _ChatApiService;

  // Chat/Conversation endpoints
  @GET('/chats')
  Future<PaginatedResponse<ChatModel>> getChats({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @GET('/chats/archived')
  Future<PaginatedResponse<ChatModel>> getArchivedChats({
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  @POST('/chats')
  Future<ChatModel> createChat(@Body() CreateChatRequest request);

  @POST('/chats/group')
  Future<ChatModel> createGroupChat(@Body() CreateGroupChatRequest request);

  @GET('/chats/{chatId}')
  Future<ChatModel> getChat(@Path('chatId') String chatId);

  @GET('/chats/user/{userId}')
  Future<ChatModel> getChatByUserId(@Path('userId') String userId);

  @DELETE('/chats/{chatId}')
  Future<void> deleteChat(@Path('chatId') String chatId);

  @POST('/chats/{chatId}/archive')
  Future<void> archiveChat(@Path('chatId') String chatId);

  @POST('/chats/{chatId}/unarchive')
  Future<void> unarchiveChat(@Path('chatId') String chatId);

  @POST('/chats/{chatId}/mute')
  Future<void> muteChat(
    @Path('chatId') String chatId,
    @Body() MuteChatRequest? request,
  );

  @POST('/chats/{chatId}/unmute')
  Future<void> unmuteChat(@Path('chatId') String chatId);

  @GET('/chats/{chatId}/muted')
  Future<MutedStatusResponse> isChatMuted(@Path('chatId') String chatId);

  // Message endpoints
  @GET('/chats/{chatId}/messages')
  Future<PaginatedResponse<MessageModel>> getMessages(
    @Path('chatId') String chatId, {
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 50,
  });

  @POST('/chats/{chatId}/messages')
  Future<MessageModel> sendMessage(
    @Path('chatId') String chatId,
    @Body() SendMessageRequest request,
  );

  @DELETE('/chats/{chatId}/messages/{messageId}')
  Future<void> deleteMessage(
    @Path('chatId') String chatId,
    @Path('messageId') String messageId,
  );

  @POST('/chats/{chatId}/messages/{messageId}/read')
  Future<void> markMessageAsRead(
    @Path('chatId') String chatId,
    @Path('messageId') String messageId,
  );

  @POST('/chats/{chatId}/read')
  Future<void> markChatAsRead(@Path('chatId') String chatId);

  @POST('/chats/{chatId}/read-all')
  Future<void> markAllAsRead(@Path('chatId') String chatId);

  // Typing indicators
  @POST('/chats/{chatId}/typing')
  Future<void> sendTypingIndicator(@Path('chatId') String chatId);

  // Media messages
  @MultiPart()
  @POST('/chats/{chatId}/messages/media')
  Future<MessageModel> sendMediaMessage(
    @Path('chatId') String chatId,
    @Part(name: 'file') List<int> file,
    @Part(name: 'fileName') String fileName,
    @Part(name: 'type') String type,
    @Part(name: 'caption') String? caption,
  );

  // Reactions
  @POST('/chats/{chatId}/messages/{messageId}/reactions')
  Future<void> addReaction(
    @Path('chatId') String chatId,
    @Path('messageId') String messageId,
    @Body() AddReactionRequest request,
  );

  @DELETE('/chats/{chatId}/messages/{messageId}/reactions')
  Future<void> removeReaction(
    @Path('chatId') String chatId,
    @Path('messageId') String messageId,
  );

  // Unread counts
  @GET('/chats/unread-count')
  Future<UnreadCountResponse> getTotalUnreadCount();

  @GET('/chats/{chatId}/unread-count')
  Future<UnreadCountResponse> getUnreadCount(@Path('chatId') String chatId);

  // Block in chat
  @POST('/chats/{chatId}/block')
  Future<void> blockUserInChat(@Path('chatId') String chatId);

  @POST('/chats/{chatId}/unblock')
  Future<void> unblockUserInChat(@Path('chatId') String chatId);

  // Search
  @GET('/chats/messages/search')
  Future<PaginatedResponse<MessageModel>> searchMessages(
    @Query('q') String query, {
    @Query('chatId') String? chatId,
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // Group operations
  @POST('/chats/{chatId}/participants')
  Future<void> addParticipant(
    @Path('chatId') String chatId,
    @Body() AddParticipantRequest request,
  );

  @DELETE('/chats/{chatId}/participants/{userId}')
  Future<void> removeParticipant(
    @Path('chatId') String chatId,
    @Path('userId') String userId,
  );

  @POST('/chats/{chatId}/leave')
  Future<void> leaveGroup(@Path('chatId') String chatId);

  @PUT('/chats/{chatId}/group')
  Future<void> updateGroupInfo(
    @Path('chatId') String chatId,
    @Body() UpdateGroupRequest request,
  );

  @GET('/chats/{chatId}/participants')
  Future<List<ChatParticipantModel>> getParticipants(@Path('chatId') String chatId);
}
