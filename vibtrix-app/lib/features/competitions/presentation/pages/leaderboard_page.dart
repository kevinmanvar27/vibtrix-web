import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_provider.dart';

/// Page showing competition leaderboard/rankings
class LeaderboardPage extends ConsumerStatefulWidget {
  final String competitionId;
  
  const LeaderboardPage({
    super.key,
    required this.competitionId,
  });

  @override
  ConsumerState<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends ConsumerState<LeaderboardPage> {
  Future<void> _refresh() async {
    await ref.read(competitionDetailProvider(widget.competitionId).notifier)
        .loadLeaderboard(widget.competitionId);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(competitionDetailProvider(widget.competitionId));
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterOptions(),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? _buildError(state.error!)
              : RefreshIndicator(
                  onRefresh: _refresh,
                  child: _buildLeaderboard(state.leaderboard),
                ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.leaderboard_outlined, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            error,
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _refresh,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboard(List<LeaderboardEntryModel> leaderboard) {
    if (leaderboard.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.leaderboard_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(
              'No entries yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      );
    }

    return CustomScrollView(
      slivers: [
        // Top 3 podium
        SliverToBoxAdapter(
          child: _buildPodium(leaderboard.take(3).toList()),
        ),
        // Rest of the leaderboard
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final entry = leaderboard[index + 3];
                return _buildLeaderboardTile(entry, index + 4);
              },
              childCount: (leaderboard.length > 3) ? (leaderboard.length - 3) : 0,
            ),
          ),
        ),
        // Current user position if not in top
        SliverToBoxAdapter(
          child: _buildCurrentUserPosition(leaderboard),
        ),
      ],
    );
  }

  Widget _buildPodium(List<LeaderboardEntryModel> topThree) {
    if (topThree.isEmpty) {
      return const SizedBox(height: 200, child: Center(child: Text('No entries yet')));
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          if (topThree.length > 1)
            _buildPodiumItem(topThree[1], 2, 100)
          else
            const SizedBox(width: 100),
          const SizedBox(width: 8),
          // 1st place
          if (topThree.isNotEmpty)
            _buildPodiumItem(topThree[0], 1, 130),
          const SizedBox(width: 8),
          // 3rd place
          if (topThree.length > 2)
            _buildPodiumItem(topThree[2], 3, 80)
          else
            const SizedBox(width: 100),
        ],
      ),
    );
  }

  Widget _buildPodiumItem(LeaderboardEntryModel entry, int rank, double height) {
    final colors = {
      1: Colors.amber,
      2: Colors.grey.shade400,
      3: Colors.brown.shade300,
    };
    final color = colors[rank] ?? Colors.grey;
    final user = entry.user;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Crown for 1st place
        if (rank == 1)
          const Icon(Icons.workspace_premium, color: Colors.amber, size: 32),
        // Avatar
        Stack(
          alignment: Alignment.bottomRight,
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: color, width: 3),
              ),
              child: NetworkAvatar(
                imageUrl: user?.profilePicture,
                fallbackText: user?.name ?? user?.username ?? 'U',
                radius: rank == 1 ? 40 : 32,
              ),
            ),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$rank',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Name
        SizedBox(
          width: 100,
          child: Text(
            user?.name ?? user?.username ?? 'Unknown',
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w600),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        // Votes
        Text(
          '${entry.votes} votes',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 8),
        // Podium stand
        Container(
          width: 100,
          height: height,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.3),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
          ),
          child: Center(
            child: Text(
              '#$rank',
              style: TextStyle(
                color: color,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardTile(LeaderboardEntryModel entry, int rank) {
    final user = entry.user;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 30,
              child: Text(
                '#$rank',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade600,
                ),
              ),
            ),
            NetworkAvatar(
              imageUrl: user?.profilePicture,
              fallbackText: user?.name ?? user?.username ?? 'U',
              radius: 20,
            ),
          ],
        ),
        title: Text(
          user?.name ?? user?.username ?? 'Unknown',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text('@${user?.username ?? 'unknown'}'),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${entry.votes}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Text(
              'votes',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 11,
              ),
            ),
          ],
        ),
        onTap: () {
          Navigator.pushNamed(context, '/profile', arguments: entry.odUserId);
        },
      ),
    );
  }

  Widget _buildCurrentUserPosition(List<LeaderboardEntryModel> leaderboard) {
    final authState = ref.watch(authProvider);
    final currentUser = authState.user;
    
    if (currentUser == null) return const SizedBox.shrink();
    
    // Find current user in leaderboard
    final userEntry = leaderboard.where((e) => e.odUserId == currentUser.id).firstOrNull;
    final userRank = userEntry != null 
        ? leaderboard.indexOf(userEntry) + 1 
        : null;
    
    // Don't show if user is in top 10 (already visible)
    if (userRank != null && userRank <= 10) return const SizedBox.shrink();
    
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              userRank != null ? '#$userRank' : '--',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          NetworkAvatar(
            imageUrl: currentUser.profilePicture,
            fallbackText: currentUser.name ?? currentUser.username,
            radius: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Position',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  userEntry != null ? '${userEntry.votes} votes' : 'Not participating',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          if (userEntry?.postId != null)
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, '/post', arguments: userEntry!.postId);
              },
              child: const Text('View Entry'),
            ),
        ],
      ),
    );
  }

  void _showFilterOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sort By',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.trending_up),
              title: const Text('Most Votes'),
              selected: true,
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Most Recent'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.favorite),
              title: const Text('Most Liked'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
