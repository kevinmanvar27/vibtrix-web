import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../users/presentation/providers/users_provider.dart';
import 'chat_room_page.dart';

/// Page for starting a new chat conversation
class NewChatPage extends ConsumerStatefulWidget {
  const NewChatPage({super.key});

  @override
  ConsumerState<NewChatPage> createState() => _NewChatPageState();
}

class _NewChatPageState extends ConsumerState<NewChatPage> {
  final _searchController = TextEditingController();
  List<SimpleUserModel> _searchResults = [];
  bool _isSearching = false;
  bool _isCreatingChat = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchUsers(String query) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    
    final usersRepo = ref.read(usersRepositoryProvider);
    final result = await usersRepo.searchUsers(query);
    
    result.fold(
      (failure) {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
      },
      (response) {
        setState(() {
          _searchResults = response.data;
          _isSearching = false;
        });
      },
    );
  }

  Future<void> _startChat(SimpleUserModel user) async {
    if (_isCreatingChat) return;
    
    setState(() => _isCreatingChat = true);
    
    final chatRepo = ref.read(chatRepositoryProvider);
    
    // Try to get existing chat or create new one
    var result = await chatRepo.getChatByUserId(user.id);
    
    result.fold(
      (failure) async {
        // If no existing chat, create one
        final createResult = await chatRepo.createChat(user.id);
        createResult.fold(
          (createFailure) {
            setState(() => _isCreatingChat = false);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to start chat: ${createFailure.message}')),
              );
            }
          },
          (chat) {
            setState(() => _isCreatingChat = false);
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => ChatRoomPage(
                  chatId: chat.id,
                  otherUser: user,
                ),
              ),
            );
          },
        );
      },
      (chat) {
        setState(() => _isCreatingChat = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ChatRoomPage(
              chatId: chat.id,
              otherUser: user,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final suggestedUsersAsync = ref.watch(suggestedUsersProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('New Message'),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search users...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _searchUsers('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: isDark ? AppColors.darkMuted : Colors.grey[200],
                  ),
                  onChanged: _searchUsers,
                ),
              ),

              // Results
              Expanded(
                child: _searchController.text.isNotEmpty
                    ? _buildSearchResults()
                    : _buildSuggestedUsers(suggestedUsersAsync),
              ),
            ],
          ),
          
          // Loading overlay when creating chat
          if (_isCreatingChat)
            Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_isSearching) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No users found for "${_searchController.text}"',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        final user = _searchResults[index];
        return _UserTile(
          user: user,
          onTap: () => _startChat(user),
        );
      },
    );
  }

  Widget _buildSuggestedUsers(AsyncValue<List<SimpleUserModel>> suggestedUsersAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'Suggested',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: suggestedUsersAsync.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
            error: (e, s) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('Failed to load suggestions'),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => ref.invalidate(suggestedUsersProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
            data: (users) => users.isEmpty
                ? const Center(child: Text('No suggestions available'))
                : ListView.builder(
                    itemCount: users.length,
                    itemBuilder: (context, index) {
                      final user = users[index];
                      return _UserTile(
                        user: user,
                        onTap: () => _startChat(user),
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }
}

class _UserTile extends StatelessWidget {
  final SimpleUserModel user;
  final VoidCallback onTap;

  const _UserTile({
    required this.user,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: NetworkAvatar(
        imageUrl: user.profilePicture,
        fallbackText: user.name ?? user.username,
        radius: 20,
      ),
      title: Row(
        children: [
          Text(
            user.name ?? user.username,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          if (user.isVerified) ...[
            const SizedBox(width: 4),
            const Icon(Icons.verified, color: Colors.blue, size: 16),
          ],
        ],
      ),
      subtitle: Text('@${user.username}'),
      onTap: onTap,
    );
  }
}
