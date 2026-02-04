import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../data/models/chat_model.dart';

/// Abstract repository for chat operations
abstract class ChatRepository {
  // Chat list operations
  Future<Result<PaginatedResponse<ChatModel>>> getChats({
    String? cursor,
    int limit = 20,
  });
  Future<Result<ChatModel>> getChat(String chatId);
  Future<Result<ChatModel>> getChatByUserId(String userId);
  Future<Result<ChatModel>> createChat(String userId);
  Future<Result<void>> deleteChat(String chatId);
  Future<Result<void>> archiveChat(String chatId);
  Future<Result<void>> unarchiveChat(String chatId);
  Future<Result<PaginatedResponse<ChatModel>>> getArchivedChats({
    String? cursor,
    int limit = 20,
  });
  
  // Message operations
  Future<Result<PaginatedResponse<MessageModel>>> getMessages(
    String chatId, {
    String? cursor,
    int limit = 50,
  });
  Future<Result<MessageModel>> sendMessage(String chatId, SendMessageRequest request);
  Future<Result<void>> deleteMessage(String chatId, String messageId);
  Future<Result<void>> markMessageAsRead(String chatId, String messageId);
  Future<Result<void>> markAllAsRead(String chatId);
  
  // Typing indicators
  Future<Result<void>> sendTypingIndicator(String chatId);
  
  // Media messages
  Future<Result<MessageModel>> sendMediaMessage(
    String chatId,
    String mediaUrl,
    MessageType type, {
    String? caption,
  });
  
  // Reactions
  Future<Result<void>> addReaction(String chatId, String messageId, String emoji);
  Future<Result<void>> removeReaction(String chatId, String messageId);
  
  // Unread counts
  Future<Result<int>> getTotalUnreadCount();
  Future<Result<int>> getUnreadCount(String chatId);
  
  // Chat settings
  Future<Result<void>> muteChat(String chatId, Duration? duration);
  Future<Result<void>> unmuteChat(String chatId);
  Future<Result<bool>> isChatMuted(String chatId);
  
  // Block in chat context
  Future<Result<void>> blockUserInChat(String chatId);
  Future<Result<void>> unblockUserInChat(String chatId);
  
  // Search
  Future<Result<PaginatedResponse<MessageModel>>> searchMessages(
    String query, {
    String? chatId,
    String? cursor,
    int limit = 20,
  });
  
  // Group chat operations (if applicable)
  Future<Result<ChatModel>> createGroupChat(CreateGroupChatRequest request);
  Future<Result<void>> addParticipant(String chatId, String userId);
  Future<Result<void>> removeParticipant(String chatId, String userId);
  Future<Result<void>> leaveGroup(String chatId);
  Future<Result<void>> updateGroupInfo(String chatId, UpdateGroupRequest request);
  Future<Result<List<ChatParticipantModel>>> getParticipants(String chatId);
}
