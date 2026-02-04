import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/models/base_response.dart';
import '../../domain/repositories/chat_repository.dart';
import '../datasources/chat_api_service.dart';
import '../models/chat_model.dart';

/// Implementation of ChatRepository
class ChatRepositoryImpl implements ChatRepository {
  final ChatApiService _apiService;

  ChatRepositoryImpl({required ChatApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<PaginatedResponse<ChatModel>>> getChats({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getChats(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ChatModel>> getChat(String chatId) async {
    try {
      final chat = await _apiService.getChat(chatId);
      return Right(chat);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ChatModel>> getChatByUserId(String userId) async {
    try {
      final chat = await _apiService.getChatByUserId(userId);
      return Right(chat);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ChatModel>> createChat(String userId) async {
    try {
      final chat = await _apiService.createChat(CreateChatRequest(participantIds: [userId]));
      return Right(chat);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteChat(String chatId) async {
    try {
      await _apiService.deleteChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> archiveChat(String chatId) async {
    try {
      await _apiService.archiveChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> unarchiveChat(String chatId) async {
    try {
      await _apiService.unarchiveChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<ChatModel>>> getArchivedChats({
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.getArchivedChats(cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<MessageModel>>> getMessages(
    String chatId, {
    String? cursor,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.getMessages(chatId, cursor: cursor, limit: limit);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<MessageModel>> sendMessage(String chatId, SendMessageRequest request) async {
    try {
      final message = await _apiService.sendMessage(chatId, request);
      return Right(message);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteMessage(String chatId, String messageId) async {
    try {
      await _apiService.deleteMessage(chatId, messageId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> markMessageAsRead(String chatId, String messageId) async {
    try {
      await _apiService.markMessageAsRead(chatId, messageId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> markAllAsRead(String chatId) async {
    try {
      await _apiService.markAllAsRead(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> sendTypingIndicator(String chatId) async {
    try {
      await _apiService.sendTypingIndicator(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<MessageModel>> sendMediaMessage(
    String chatId,
    String mediaUrl,
    MessageType type, {
    String? caption,
  }) async {
    try {
      final message = await _apiService.sendMessage(
        chatId,
        SendMessageRequest(
          content: caption ?? '',
          type: type,
          mediaUrl: mediaUrl,
        ),
      );
      return Right(message);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> addReaction(String chatId, String messageId, String emoji) async {
    try {
      await _apiService.addReaction(chatId, messageId, AddReactionRequest(emoji: emoji));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> removeReaction(String chatId, String messageId) async {
    try {
      await _apiService.removeReaction(chatId, messageId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<int>> getTotalUnreadCount() async {
    try {
      final response = await _apiService.getTotalUnreadCount();
      return Right(response.count);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<int>> getUnreadCount(String chatId) async {
    try {
      final response = await _apiService.getUnreadCount(chatId);
      return Right(response.count);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> muteChat(String chatId, Duration? duration) async {
    try {
      await _apiService.muteChat(
        chatId,
        MuteChatRequest(durationMinutes: duration?.inMinutes),
      );
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> unmuteChat(String chatId) async {
    try {
      await _apiService.unmuteChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> isChatMuted(String chatId) async {
    try {
      final chat = await _apiService.getChat(chatId);
      return Right(chat.isMuted);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> blockUserInChat(String chatId) async {
    try {
      await _apiService.blockUserInChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> unblockUserInChat(String chatId) async {
    try {
      await _apiService.unblockUserInChat(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<MessageModel>>> searchMessages(
    String query, {
    String? chatId,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final response = await _apiService.searchMessages(
        query,
        chatId: chatId,
        cursor: cursor,
        limit: limit,
      );
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ChatModel>> createGroupChat(CreateGroupChatRequest request) async {
    try {
      final chat = await _apiService.createGroupChat(request);
      return Right(chat);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> addParticipant(String chatId, String userId) async {
    try {
      await _apiService.addParticipant(chatId, AddParticipantRequest(userId: userId));
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> removeParticipant(String chatId, String userId) async {
    try {
      await _apiService.removeParticipant(chatId, userId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> leaveGroup(String chatId) async {
    try {
      await _apiService.leaveGroup(chatId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> updateGroupInfo(String chatId, UpdateGroupRequest request) async {
    try {
      await _apiService.updateGroupInfo(chatId, request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<ChatParticipantModel>>> getParticipants(String chatId) async {
    try {
      final participants = await _apiService.getParticipants(chatId);
      return Right(participants);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
