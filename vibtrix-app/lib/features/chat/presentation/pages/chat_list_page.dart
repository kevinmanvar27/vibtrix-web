import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/chat_model.dart';
import '../providers/chat_provider.dart';
import 'chat_room_page.dart';
import 'new_chat_page.dart';

/// Page showing list of chat conversations - CONNECTED TO REAL API
class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  @override
  void initState() {
    super.initState();
    // Load chats when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatsListProvider.notifier).loadChats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final chatsState = ref.watch(chatsListProvider);
    final currentUser = ref.watch(currentUserProvider);
    final currentUserId = currentUser?.id ?? '';

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('Messages'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_square),
            onPressed: () => _navigateToNewChat(),
          ),
        ],
      ),
      body: _buildBody(chatsState, currentUserId, theme),
    );
  }

  Widget _buildBody(ChatsListState state, String currentUserId, ThemeData theme) {
    if (state.isLoading && state.chats.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (state.error != null && state.chats.isEmpty) {
      return _buildErrorState(state.error!);
    }

    if (state.chats.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(chatsListProvider.notifier).refresh(),
      color: AppColors.primary,
      child: ListView.builder(
        itemCount: state.chats.length + (state.isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == state.chats.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            );
          }

          final chat = state.chats[index];
          return _ConversationTile(
            chat: chat,
            currentUserId: currentUserId,
            onTap: () => _navigateToChatRoom(chat, currentUserId),
            onLongPress: () => _showConversationOptions(chat),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'No messages yet',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start a conversation with someone',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _navigateToNewChat,
            icon: const Icon(Icons.add),
            label: const Text('New Message'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            'Error loading chats',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(
            error,
            style: const TextStyle(color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => ref.read(chatsListProvider.notifier).loadChats(),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToNewChat() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const NewChatPage()),
    );
  }

  void _navigateToChatRoom(ChatModel chat, String currentUserId) {
    final otherUser = chat.getOtherParticipant(currentUserId)?.user;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatRoomPage(
          chatId: chat.id,
          otherUser: otherUser,
        ),
      ),
    );
  }

  void _showConversationOptions(ChatModel chat) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(chat.isMuted ? Icons.notifications : Icons.notifications_off_outlined),
              title: Text(chat.isMuted ? 'Unmute Notifications' : 'Mute Notifications'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement mute/unmute via API
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(chat.isMuted ? 'Notifications unmuted!' : 'Notifications muted!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.archive_outlined),
              title: const Text('Archive'),
              onTap: () {
                Navigator.pop(context);
                // TODO: Implement archive via API
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Conversation archived!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.error),
              title: const Text('Delete', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
                _confirmDelete(chat);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(ChatModel chat) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Conversation?'),
        content: const Text('This will permanently delete this conversation and all messages.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(chatsListProvider.notifier).deleteChat(chat.id);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Conversation deleted!')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }
}

/// Individual conversation tile widget
class _ConversationTile extends StatelessWidget {
  final ChatModel chat;
  final String currentUserId;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _ConversationTile({
    required this.chat,
    required this.currentUserId,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final displayName = chat.getDisplayName(currentUserId);
    final displayImage = chat.getDisplayImage(currentUserId);
    final lastMessage = chat.lastMessage;
    final hasUnread = chat.unreadCount > 0;
    final otherParticipant = chat.getOtherParticipant(currentUserId);
    final isVerified = otherParticipant?.user?.isVerified ?? false;

    return ListTile(
      onTap: onTap,
      onLongPress: onLongPress,
      leading: NetworkAvatar(
        imageUrl: displayImage,
        fallbackText: displayName,
        radius: 28,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              displayName,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (isVerified)
            const Padding(
              padding: EdgeInsets.only(left: 4),
              child: Icon(Icons.verified, color: AppColors.primary, size: 16),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          if (lastMessage != null && lastMessage.senderId == currentUserId)
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: Icon(
                lastMessage.isRead ? Icons.done_all : Icons.done,
                size: 16,
                color: lastMessage.isRead ? AppColors.primary : Colors.grey,
              ),
            ),
          Expanded(
            child: Text(
              _getLastMessagePreview(lastMessage),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: hasUnread
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontWeight: hasUnread ? FontWeight.w500 : FontWeight.normal,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            _formatTime(lastMessage?.createdAt ?? chat.updatedAt ?? chat.createdAt),
            style: TextStyle(
              fontSize: 12,
              color: hasUnread ? AppColors.primary : Colors.grey,
            ),
          ),
          const SizedBox(height: 4),
          if (hasUnread)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: Text(
                chat.unreadCount > 99 ? '99+' : chat.unreadCount.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getLastMessagePreview(MessageModel? message) {
    if (message == null) return 'Start a conversation';
    
    switch (message.type) {
      case MessageType.image:
        return '📷 Photo';
      case MessageType.video:
        return '🎥 Video';
      case MessageType.audio:
        return '🎵 Audio';
      case MessageType.file:
        return '📎 File';
      default:
        return message.content ?? '';
    }
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    
    if (diff.inDays == 0) {
      return DateFormat.jm().format(dateTime);
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return DateFormat.E().format(dateTime);
    } else {
      return DateFormat.MMMd().format(dateTime);
    }
  }
}
