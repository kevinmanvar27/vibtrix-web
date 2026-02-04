import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../users/presentation/providers/users_provider.dart';

/// Provider for post likes
final postLikesProvider = FutureProvider.family<List<SimpleUserModel>, String>((ref, postId) async {
  final repository = ref.watch(postsRepositoryProvider);
  final result = await repository.getPostLikes(postId);
  return result.fold(
    (failure) => [],
    (response) => response.data.cast<SimpleUserModel>(),
  );
});

/// Page showing users who liked a post
class LikesPage extends ConsumerStatefulWidget {
  final String postId;
  
  const LikesPage({
    super.key,
    required this.postId,
  });

  @override
  ConsumerState<LikesPage> createState() => _LikesPageState();
}

class _LikesPageState extends ConsumerState<LikesPage> {
  final Set<String> _followingIds = {};

  Future<void> _refresh() async {
    ref.invalidate(postLikesProvider(widget.postId));
  }

  @override
  Widget build(BuildContext context) {
    final likesAsync = ref.watch(postLikesProvider(widget.postId));
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Likes'),
      ),
      body: likesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text('Failed to load likes', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _refresh,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (likers) => likers.isEmpty
            ? _buildEmptyState()
            : RefreshIndicator(
                onRefresh: _refresh,
                child: ListView.builder(
                  itemCount: likers.length,
                  itemBuilder: (context, index) => _buildUserTile(likers[index]),
                ),
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.favorite_outline, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No likes yet',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to like this post!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade500,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserTile(SimpleUserModel user) {
    final currentUser = ref.watch(authProvider).user;
    final isCurrentUser = currentUser?.id == user.id;
    final isFollowing = _followingIds.contains(user.id);
    final displayName = user.name ?? user.username;

    return ListTile(
      leading: GestureDetector(
        onTap: () => Navigator.pushNamed(context, '/profile', arguments: user.id),
        child: NetworkAvatar(
          imageUrl: user.profilePicture,
          fallbackText: displayName,
          radius: 20,
        ),
      ),
      title: GestureDetector(
        onTap: () => Navigator.pushNamed(context, '/profile', arguments: user.id),
        child: Row(
          children: [
            Text(
              displayName,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            if (user.isVerified) ...[
              const SizedBox(width: 4),
              const Icon(Icons.verified, color: Colors.blue, size: 16),
            ],
          ],
        ),
      ),
      subtitle: Text('@${user.username}'),
      trailing: !isCurrentUser
          ? isFollowing
              ? OutlinedButton(
                  onPressed: () async {
                    final usersRepo = ref.read(usersRepositoryProvider);
                    await usersRepo.unfollowUser(user.id);
                    setState(() => _followingIds.remove(user.id));
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Unfollowed $displayName')),
                      );
                    }
                  },
                  child: const Text('Following'),
                )
              : FilledButton(
                  onPressed: () async {
                    final usersRepo = ref.read(usersRepositoryProvider);
                    await usersRepo.followUser(user.id);
                    setState(() => _followingIds.add(user.id));
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Following $displayName')),
                      );
                    }
                  },
                  child: const Text('Follow'),
                )
          : null,
    );
  }
}
