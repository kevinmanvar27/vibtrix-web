import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_provider.dart';

/// Page showing all participants in a competition
/// NOTE: Backend does not have /competitions/{id}/participants endpoint.
/// This page shows the leaderboard entries instead as a workaround.
class ParticipantsPage extends ConsumerStatefulWidget {
  final String competitionId;
  
  const ParticipantsPage({
    super.key,
    required this.competitionId,
  });

  @override
  ConsumerState<ParticipantsPage> createState() => _ParticipantsPageState();
}

class _ParticipantsPageState extends ConsumerState<ParticipantsPage> {
  String _sortBy = 'votes'; // votes, recent, name

  Future<void> _refresh() async {
    // Reload competition details which includes leaderboard
    await ref.read(competitionDetailProvider(widget.competitionId).notifier)
        .loadCompetition(widget.competitionId);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(competitionDetailProvider(widget.competitionId));
    final leaderboard = state.leaderboard;
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Participants${leaderboard.isNotEmpty ? ' (${leaderboard.length})' : ''}'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.sort),
            onSelected: (value) {
              setState(() => _sortBy = value);
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'votes',
                child: Row(
                  children: [
                    Icon(
                      Icons.how_to_vote,
                      color: _sortBy == 'votes' ? Theme.of(context).colorScheme.primary : null,
                    ),
                    const SizedBox(width: 8),
                    const Text('Most Votes'),
                  ],
                ),
              ),
              PopupMenuItem(
                value: 'name',
                child: Row(
                  children: [
                    Icon(
                      Icons.sort_by_alpha,
                      color: _sortBy == 'name' ? Theme.of(context).colorScheme.primary : null,
                    ),
                    const SizedBox(width: 8),
                    const Text('Name'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? _buildError(state.error!)
              : leaderboard.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: _refresh,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: leaderboard.length,
                        itemBuilder: (context, index) {
                          return _buildParticipantCard(leaderboard[index], index + 1);
                        },
                      ),
                    ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            error,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No participants yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to join!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade500,
                ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () {
              Navigator.pop(context);
            },
            icon: const Icon(Icons.add),
            label: const Text('Join Competition'),
          ),
        ],
      ),
    );
  }

  Widget _buildParticipantCard(LeaderboardEntryModel entry, int rank) {
    final isTopThree = rank <= 3;
    final rankColors = {
      1: Colors.amber,
      2: Colors.grey.shade400,
      3: Colors.brown.shade300,
    };
    final user = entry.user;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(context, '/profile', arguments: entry.user);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Rank
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isTopThree
                      ? rankColors[rank]?.withValues(alpha: 0.2)
                      : Colors.grey.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isTopThree
                      ? Icon(
                          Icons.emoji_events,
                          color: rankColors[rank],
                          size: 20,
                        )
                      : Text(
                          '#$rank',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade600,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              // Avatar
              NetworkAvatar(
                imageUrl: user?.profilePicture,
                fallbackText: user?.name ?? user?.username ?? 'U',
                radius: 28,
              ),
              const SizedBox(width: 12),
              // User info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.name ?? user?.username ?? 'Unknown',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      '@${user?.username ?? 'unknown'}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              // Score
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.star,
                        size: 16,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${entry.score}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'points',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
