/// Chat state management using Riverpod
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/chat_model.dart';
import '../../domain/repositories/chat_repository.dart';

// ==================== STATE CLASSES ====================

class ChatsListState {
  final List<ChatModel> chats;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? nextCursor;
  final bool hasMore;

  const ChatsListState({
    this.chats = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.nextCursor,
    this.hasMore = true,
  });

  ChatsListState copyWith({
    List<ChatModel>? chats,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? nextCursor,
    bool? hasMore,
  }) {
    return ChatsListState(
      chats: chats ?? this.chats,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class ChatMessagesState {
  final String chatId;
  final List<MessageModel> messages;
  final bool isLoading;
  final bool isLoadingMore;
  final bool isSending;
  final String? error;
  final String? nextCursor;
  final bool hasMore;

  const ChatMessagesState({
    required this.chatId,
    this.messages = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.isSending = false,
    this.error,
    this.nextCursor,
    this.hasMore = true,
  });

  ChatMessagesState copyWith({
    String? chatId,
    List<MessageModel>? messages,
    bool? isLoading,
    bool? isLoadingMore,
    bool? isSending,
    String? error,
    String? nextCursor,
    bool? hasMore,
  }) {
    return ChatMessagesState(
      chatId: chatId ?? this.chatId,
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      isSending: isSending ?? this.isSending,
      error: error,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// ==================== NOTIFIERS ====================

class ChatsListNotifier extends StateNotifier<ChatsListState> {
  final ChatRepository _repository;

  ChatsListNotifier(this._repository) : super(const ChatsListState());

  Future<void> loadChats() async {
    debugPrint('💬 [ChatProvider] Loading chats');
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getChats();

    result.fold(
      (failure) {
        debugPrint('❌ [ChatProvider] Failed to load chats: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('✅ [ChatProvider] Loaded ${response.data.length} chats');
        state = state.copyWith(
          isLoading: false,
          chats: response.data,
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) return;

    debugPrint('💬 [ChatProvider] Loading more chats (cursor: ${state.nextCursor})');
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getChats(cursor: state.nextCursor);

    result.fold(
      (failure) {
        debugPrint('❌ [ChatProvider] Failed to load more chats');
        state = state.copyWith(
          isLoadingMore: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('✅ [ChatProvider] Loaded ${response.data.length} more chats');
        state = state.copyWith(
          isLoadingMore: false,
          chats: [...state.chats, ...response.data],
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> refresh() async {
    debugPrint('💬 [ChatProvider] Refreshing chats');
    state = const ChatsListState();
    await loadChats();
  }

  Future<ChatModel?> createOrGetChat(String userId) async {
    debugPrint('💬 [ChatProvider] Creating or getting chat with user: $userId');
    final result = await _repository.getChatByUserId(userId);
    
    return result.fold(
      (failure) async {
        debugPrint('💬 [ChatProvider] Chat not found, creating new one');
        // Chat doesn't exist, create one
        final createResult = await _repository.createChat(userId);
        return createResult.fold(
          (f) {
            debugPrint('❌ [ChatProvider] Failed to create chat');
            return null;
          },
          (chat) {
            debugPrint('✅ [ChatProvider] Chat created: ${chat.id}');
            // Add to list
            state = state.copyWith(chats: [chat, ...state.chats]);
            return chat;
          },
        );
      },
      (chat) {
        debugPrint('✅ [ChatProvider] Found existing chat: ${chat.id}');
        return chat;
      },
    );
  }

  Future<void> deleteChat(String chatId) async {
    debugPrint('💬 [ChatProvider] Deleting chat: $chatId');
    final result = await _repository.deleteChat(chatId);

    result.fold(
      (failure) {
        debugPrint('❌ [ChatProvider] Failed to delete chat');
        state = state.copyWith(error: failure.message);
      },
      (_) {
        debugPrint('✅ [ChatProvider] Chat deleted');
        state = state.copyWith(
          chats: state.chats.where((c) => c.id != chatId).toList(),
        );
      },
    );
  }

  void updateChatInList(ChatModel updatedChat) {
    final index = state.chats.indexWhere((c) => c.id == updatedChat.id);
    if (index != -1) {
      final updatedChats = [...state.chats];
      updatedChats[index] = updatedChat;
      state = state.copyWith(chats: updatedChats);
    }
  }
}

class ChatMessagesNotifier extends StateNotifier<ChatMessagesState> {
  final ChatRepository _repository;

  ChatMessagesNotifier(this._repository, String chatId) 
      : super(ChatMessagesState(chatId: chatId));

  Future<void> loadMessages() async {
    debugPrint('💬 [ChatMessages] Loading messages for chat: ${state.chatId}');
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getMessages(state.chatId);

    result.fold(
      (failure) {
        debugPrint('❌ [ChatMessages] Failed to load messages: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('✅ [ChatMessages] Loaded ${response.data.length} messages');
        state = state.copyWith(
          isLoading: false,
          messages: response.data,
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) return;

    debugPrint('💬 [ChatMessages] Loading more messages');
    state = state.copyWith(isLoadingMore: true);

    final result = await _repository.getMessages(
      state.chatId,
      cursor: state.nextCursor,
    );

    result.fold(
      (failure) {
        debugPrint('❌ [ChatMessages] Failed to load more messages');
        state = state.copyWith(
          isLoadingMore: false,
          error: failure.message,
        );
      },
      (response) {
        debugPrint('✅ [ChatMessages] Loaded ${response.data.length} more messages');
        state = state.copyWith(
          isLoadingMore: false,
          messages: [...state.messages, ...response.data],
          nextCursor: response.nextCursor,
          hasMore: response.hasMore,
        );
      },
    );
  }

  Future<void> sendMessage(String content, {MessageType type = MessageType.text}) async {
    debugPrint('💬 [ChatMessages] Sending message: ${content.substring(0, content.length > 20 ? 20 : content.length)}...');
    state = state.copyWith(isSending: true, error: null);

    final request = SendMessageRequest(content: content, type: type);
    final result = await _repository.sendMessage(state.chatId, request);

    result.fold(
      (failure) {
        debugPrint('❌ [ChatMessages] Failed to send message: ${failure.message}');
        state = state.copyWith(
          isSending: false,
          error: failure.message,
        );
      },
      (message) {
        debugPrint('✅ [ChatMessages] Message sent: ${message.id}');
        state = state.copyWith(
          isSending: false,
          messages: [message, ...state.messages],
        );
      },
    );
  }

  Future<void> sendMediaMessage(String mediaUrl, MessageType type, {String? caption}) async {
    debugPrint('💬 [ChatMessages] Sending media message: $type');
    state = state.copyWith(isSending: true, error: null);

    final result = await _repository.sendMediaMessage(
      state.chatId,
      mediaUrl,
      type,
      caption: caption,
    );

    result.fold(
      (failure) {
        debugPrint('❌ [ChatMessages] Failed to send media: ${failure.message}');
        state = state.copyWith(
          isSending: false,
          error: failure.message,
        );
      },
      (message) {
        debugPrint('✅ [ChatMessages] Media sent: ${message.id}');
        state = state.copyWith(
          isSending: false,
          messages: [message, ...state.messages],
        );
      },
    );
  }

  Future<void> deleteMessage(String messageId) async {
    debugPrint('💬 [ChatMessages] Deleting message: $messageId');
    final result = await _repository.deleteMessage(state.chatId, messageId);

    result.fold(
      (failure) {
        debugPrint('❌ [ChatMessages] Failed to delete message');
        state = state.copyWith(error: failure.message);
      },
      (_) {
        debugPrint('✅ [ChatMessages] Message deleted');
        state = state.copyWith(
          messages: state.messages.where((m) => m.id != messageId).toList(),
        );
      },
    );
  }

  Future<void> markAsRead() async {
    debugPrint('💬 [ChatMessages] Marking messages as read');
    await _repository.markAllAsRead(state.chatId);
  }

  void addMessage(MessageModel message) {
    state = state.copyWith(messages: [message, ...state.messages]);
  }
}

// ==================== PROVIDERS ====================

final chatsListProvider = StateNotifierProvider<ChatsListNotifier, ChatsListState>((ref) {
  return ChatsListNotifier(ref.watch(chatRepositoryProvider));
});

final chatMessagesProvider = StateNotifierProvider.family<ChatMessagesNotifier, ChatMessagesState, String>((ref, chatId) {
  return ChatMessagesNotifier(ref.watch(chatRepositoryProvider), chatId);
});

final totalUnreadCountProvider = FutureProvider<int>((ref) async {
  debugPrint('💬 [ChatProvider] Getting total unread count');
  final repository = ref.watch(chatRepositoryProvider);
  final result = await repository.getTotalUnreadCount();
  return result.fold(
    (failure) {
      debugPrint('❌ [ChatProvider] Failed to get unread count');
      return 0;
    },
    (count) {
      debugPrint('✅ [ChatProvider] Unread count: $count');
      return count;
    },
  );
});
