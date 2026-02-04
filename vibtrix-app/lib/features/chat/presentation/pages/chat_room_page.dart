import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/data/models/user_model.dart';
import '../../data/models/chat_model.dart';
import '../providers/chat_provider.dart';

/// Individual chat room page - CONNECTED TO REAL API
class ChatRoomPage extends ConsumerStatefulWidget {
  final String chatId;
  final SimpleUserModel? otherUser;
  
  const ChatRoomPage({
    super.key,
    required this.chatId,
    this.otherUser,
  });

  @override
  ConsumerState<ChatRoomPage> createState() => _ChatRoomPageState();
}

class _ChatRoomPageState extends ConsumerState<ChatRoomPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  
  bool _showScrollToBottom = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    // Load messages when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatMessagesProvider(widget.chatId).notifier).loadMessages();
      ref.read(chatMessagesProvider(widget.chatId).notifier).markAsRead();
    });
  }

  void _onScroll() {
    final showButton = _scrollController.offset > 200;
    if (showButton != _showScrollToBottom) {
      setState(() => _showScrollToBottom = showButton);
    }
    
    // Load more when scrolling to top (older messages)
    if (_scrollController.position.pixels <= 100) {
      ref.read(chatMessagesProvider(widget.chatId).notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final messagesState = ref.watch(chatMessagesProvider(widget.chatId));
    final currentUser = ref.watch(currentUserProvider);
    final currentUserId = currentUser?.id ?? '';

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: _buildAppBar(theme, isDark),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: _buildMessagesList(messagesState, currentUserId, theme),
              ),
              _buildMessageInput(theme, isDark, messagesState.isSending),
            ],
          ),
          if (_showScrollToBottom)
            Positioned(
              bottom: 80,
              right: 16,
              child: FloatingActionButton.small(
                onPressed: _scrollToBottom,
                backgroundColor: theme.cardColor,
                child: const Icon(Icons.keyboard_arrow_down),
              ),
            ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(ThemeData theme, bool isDark) {
    return AppBar(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      elevation: 0,
      titleSpacing: 0,
      title: GestureDetector(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('View ${widget.otherUser?.username ?? "user"}\'s profile')),
          );
        },
        child: Row(
          children: [
            NetworkAvatar(
              imageUrl: widget.otherUser?.profilePicture,
              radius: 18,
              fallbackText: widget.otherUser?.name ?? widget.otherUser?.username ?? 'U',
              backgroundColor: AppColors.primary.withValues(alpha: 0.2),
              foregroundColor: AppColors.primary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          widget.otherUser?.name ?? widget.otherUser?.username ?? "User",
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (widget.otherUser?.isVerified ?? false)
                        const Padding(
                          padding: EdgeInsets.only(left: 4),
                          child: Icon(Icons.verified, color: AppColors.primary, size: 16),
                        ),
                    ],
                  ),
                  const Text(
                    'Online',
                    style: TextStyle(fontSize: 12, color: Colors.green),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.videocam_outlined),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Video call coming soon!')),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.call_outlined),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Voice call coming soon!')),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () => _showChatOptions(),
        ),
      ],
    );
  }

  Widget _buildMessagesList(ChatMessagesState state, String currentUserId, ThemeData theme) {
    if (state.isLoading && state.messages.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }

    if (state.error != null && state.messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(state.error!, style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(chatMessagesProvider(widget.chatId).notifier).loadMessages(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.messages.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      reverse: true, // Messages are newest first
      itemCount: state.messages.length + (state.isLoadingMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == state.messages.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(color: AppColors.primary),
            ),
          );
        }

        final message = state.messages[index];
        final isMe = message.senderId == currentUserId;
        
        // Show date divider if needed
        final showDate = index == state.messages.length - 1 ||
            !_isSameDay(
              state.messages[index + 1].createdAt,
              message.createdAt,
            );
        
        return Column(
          children: [
            if (showDate) _buildDateDivider(message.createdAt),
            _MessageBubble(
              message: message,
              isMe: isMe,
              onLongPress: () => _showMessageOptions(message, isMe),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          NetworkAvatar(
            imageUrl: widget.otherUser?.profilePicture,
            radius: 40,
            fallbackText: widget.otherUser?.name ?? widget.otherUser?.username ?? 'U',
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            foregroundColor: AppColors.primary,
          ),
          const SizedBox(height: 16),
          Text(
            widget.otherUser?.name ?? widget.otherUser?.username ?? "User",
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start a conversation',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildDateDivider(DateTime date) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            _formatDate(date),
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ),
      ),
    );
  }

  Widget _buildMessageInput(ThemeData theme, bool isDark, bool isSending) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
          border: Border(
            top: BorderSide(color: theme.dividerColor),
          ),
        ),
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => _showAttachmentOptions(),
              color: AppColors.primary,
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkMuted : Colors.grey[200],
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          hintText: 'Type a message...',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 10,
                          ),
                        ),
                        maxLines: null,
                        textCapitalization: TextCapitalization.sentences,
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.emoji_emotions_outlined),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Emoji picker coming soon!')),
                        );
                      },
                      color: Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: isSending ? null : _sendMessage,
              child: CircleAvatar(
                backgroundColor: isSending ? Colors.grey : AppColors.primary,
                child: isSending
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    ref.read(chatMessagesProvider(widget.chatId).notifier).sendMessage(text);
    _messageController.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0, // Since reverse: true, 0 is the bottom
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.purple,
                child: Icon(Icons.photo, color: Colors.white),
              ),
              title: const Text('Photo & Video'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Gallery coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.pink,
                child: Icon(Icons.camera_alt, color: Colors.white),
              ),
              title: const Text('Camera'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Camera coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.blue,
                child: Icon(Icons.insert_drive_file, color: Colors.white),
              ),
              title: const Text('Document'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Documents coming soon!')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showChatOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('View Profile'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.search),
              title: const Text('Search in Conversation'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Search coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.notifications_off_outlined),
              title: const Text('Mute Notifications'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notifications muted!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: AppColors.error),
              title: const Text('Block User', style: TextStyle(color: AppColors.error)),
              onTap: () {
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showMessageOptions(MessageModel message, bool isMe) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.reply),
              title: const Text('Reply'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Reply coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Message copied!')),
                );
              },
            ),
            if (isMe)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: AppColors.error),
                title: const Text('Delete', style: TextStyle(color: AppColors.error)),
                onTap: () {
                  Navigator.pop(context);
                  ref.read(chatMessagesProvider(widget.chatId).notifier).deleteMessage(message.id);
                },
              ),
          ],
        ),
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (_isSameDay(now, date)) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return DateFormat.EEEE().format(date);
    } else {
      return DateFormat.yMMMd().format(date);
    }
  }
}

/// Message bubble widget
class _MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final VoidCallback onLongPress;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onLongPress: onLongPress,
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: EdgeInsets.only(
            top: 4,
            bottom: 4,
            left: isMe ? 64 : 0,
            right: isMe ? 0 : 64,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isMe
                ? AppColors.primary
                : theme.brightness == Brightness.dark
                    ? AppColors.darkMuted
                    : Colors.grey[200],
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(16),
              topRight: const Radius.circular(16),
              bottomLeft: Radius.circular(isMe ? 16 : 4),
              bottomRight: Radius.circular(isMe ? 4 : 16),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (message.type == MessageType.image)
                _buildImageMessage()
              else
                Text(
                  message.content ?? '',
                  style: TextStyle(
                    color: isMe ? Colors.white : theme.colorScheme.onSurface,
                  ),
                ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormat.jm().format(message.createdAt),
                    style: TextStyle(
                      fontSize: 10,
                      color: isMe
                          ? Colors.white.withValues(alpha: 0.7)
                          : Colors.grey,
                    ),
                  ),
                  if (isMe) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.isRead ? Icons.done_all : Icons.done,
                      size: 14,
                      color: message.isRead
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.7),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageMessage() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: CachedNetworkImage(
        imageUrl: message.mediaUrl ?? '',
        width: 200,
        height: 200,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(
          width: 200,
          height: 200,
          color: Colors.grey[300],
          child: const Center(child: CircularProgressIndicator()),
        ),
        errorWidget: (context, url, error) => Container(
          width: 200,
          height: 200,
          color: Colors.grey[300],
          child: const Icon(Icons.error),
        ),
      ),
    );
  }
}
