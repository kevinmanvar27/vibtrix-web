import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_provider.dart';
import 'leaderboard_page.dart';
import 'participants_page.dart';
import 'join_competition_page.dart';

/// Detailed view of a single competition
/// CONNECTED TO REAL API
class CompetitionDetailPage extends ConsumerWidget {
  final String competitionId;
  
  const CompetitionDetailPage({
    super.key,
    required this.competitionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final state = ref.watch(competitionDetailProvider(competitionId));

    // Handle loading state
    if (state.isLoading && state.competition == null) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    // Handle error state
    if (state.error != null && state.competition == null) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text('Error: ${state.error}'),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => ref.read(competitionDetailProvider(competitionId).notifier).loadCompetition(competitionId),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final competition = state.competition;
    if (competition == null) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: const Center(child: Text('Competition not found')),
      );
    }

    return _CompetitionDetailContent(
      competition: competition,
      competitionId: competitionId,
      leaderboard: state.leaderboard,
    );
  }
}

class _CompetitionDetailContent extends ConsumerWidget {
  final CompetitionModel competition;
  final String competitionId;
  final List<LeaderboardEntryModel> leaderboard;

  const _CompetitionDetailContent({
    required this.competition,
    required this.competitionId,
    required this.leaderboard,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: competition.thumbnailUrl ?? '',
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: AppColors.primary.withValues(alpha: 0.2)),
                    errorWidget: (context, url, error) => Container(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      child: const Icon(Icons.emoji_events, size: 64, color: AppColors.primary),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 100,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(competition.status),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _getStatusText(competition.status),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(icon: const Icon(Icons.share), onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Share link copied!')))),
              IconButton(icon: const Icon(Icons.more_vert), onPressed: () => _showOptions(context)),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(competition.name, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(competition.type.name.toUpperCase(), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildStatCard(context, icon: Icons.emoji_events, value: '₹${_formatAmount((competition.prizePool ?? 0).toDouble())}', label: 'Prize Pool', color: AppColors.warning)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard(context, icon: Icons.people, value: '${competition.participantsCount}', label: (competition.maxParticipants ?? 0) > 0 ? 'of ${competition.maxParticipants}' : 'participants', color: AppColors.primary)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatCard(context, icon: Icons.timer, value: _getTimeValue(competition), label: _getTimeLabel(competition), color: _getTimeColor(competition))),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: isDark ? AppColors.darkMuted : Colors.grey[100], borderRadius: BorderRadius.circular(12)),
                    child: Row(
                      children: [
                        const Icon(Icons.confirmation_number, color: AppColors.primary),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Entry Fee', style: TextStyle(color: Colors.grey, fontSize: 12)),
                            Text(competition.entryFee > 0 ? '₹${competition.entryFee.toStringAsFixed(0)}' : 'FREE', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const Spacer(),
                        if (competition.isParticipating)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                            child: const Row(children: [Icon(Icons.check_circle, size: 16, color: AppColors.success), SizedBox(width: 4), Text('Joined', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold))]),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text('About', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(competition.description ?? 'No description available.', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7), height: 1.5)),
                  const SizedBox(height: 24),
                  Text('Timeline', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (competition.startDate != null)
                    _buildTimelineItem(context, 'Start Date', DateFormat.yMMMd().add_jm().format(competition.startDate!), Icons.play_circle, competition.startDate!.isBefore(DateTime.now())),
                  if (competition.endDate != null)
                    _buildTimelineItem(context, 'End Date', DateFormat.yMMMd().add_jm().format(competition.endDate!), Icons.stop_circle, competition.endDate!.isBefore(DateTime.now())),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: OutlinedButton.icon(onPressed: () => _navigateToLeaderboard(context), icon: const Icon(Icons.leaderboard), label: const Text('Leaderboard'), style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)))),
                      const SizedBox(width: 12),
                      Expanded(child: OutlinedButton.icon(onPressed: () => _navigateToParticipants(context), icon: const Icon(Icons.people), label: const Text('Participants'), style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)))),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (leaderboard.isNotEmpty) ...[
                    Row(children: [Text('Top Performers', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)), const Spacer(), TextButton(onPressed: () => _navigateToLeaderboard(context), child: const Text('See All'))]),
                    const SizedBox(height: 8),
                    ...leaderboard.take(3).map((entry) => _buildLeaderboardEntry(context, entry)),
                  ],
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: _buildActionButton(context, ref, competition))),
    );
  }

  Widget _buildStatCard(BuildContext context, {required IconData icon, required String value, required String label, required Color color}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: isDark ? AppColors.darkMuted : Colors.grey[100], borderRadius: BorderRadius.circular(12)),
      child: Column(children: [Icon(icon, color: color, size: 28), const SizedBox(height: 8), Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)), Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey))]),
    );
  }

  Widget _buildTimelineItem(BuildContext context, String title, String value, IconData icon, bool isCompleted) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(children: [
        Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: isCompleted ? AppColors.success.withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(icon, size: 20, color: isCompleted ? AppColors.success : AppColors.primary)),
        const SizedBox(width: 12),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(color: Colors.grey, fontSize: 12)), Text(value, style: const TextStyle(fontWeight: FontWeight.w500))]),
        if (isCompleted) ...[const Spacer(), const Icon(Icons.check_circle, color: AppColors.success, size: 20)],
      ]),
    );
  }

  Widget _buildLeaderboardEntry(BuildContext context, LeaderboardEntryModel entry) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final user = entry.user;
    final username = user?.username ?? 'Unknown';
    final profilePicture = user?.profilePicture;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkMuted : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: entry.rank <= 3 ? Border.all(color: entry.rank == 1 ? Colors.amber : entry.rank == 2 ? Colors.grey : Colors.brown, width: 2) : null,
      ),
      child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(color: entry.rank == 1 ? Colors.amber : entry.rank == 2 ? Colors.grey : entry.rank == 3 ? Colors.brown : AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle), child: Center(child: Text('#${entry.rank}', style: TextStyle(fontWeight: FontWeight.bold, color: entry.rank <= 3 ? Colors.white : AppColors.primary, fontSize: 12)))),
        const SizedBox(width: 12),
        NetworkAvatar(imageUrl: profilePicture, fallbackText: username, radius: 20),
        const SizedBox(width: 12),
        Expanded(child: Text(username, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold))),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [Text('${entry.votes}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)), const Text('votes', style: TextStyle(fontSize: 10, color: Colors.grey))]),
      ]),
    );
  }

  Widget _buildActionButton(BuildContext context, WidgetRef ref, CompetitionModel competition) {
    if (competition.status == CompetitionStatus.completed) {
      return ElevatedButton(onPressed: null, style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('Competition Ended'));
    }
    if (competition.isParticipating) {
      return ElevatedButton.icon(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload your entry!'))), icon: const Icon(Icons.upload), label: const Text('Upload Entry'), style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
    }
    if (competition.status == CompetitionStatus.upcoming) {
      return ElevatedButton.icon(onPressed: () => _joinCompetition(context, ref, competition), icon: const Icon(Icons.notifications_active), label: const Text('Join & Get Notified'), style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
    }
    return ElevatedButton.icon(onPressed: () => _joinCompetition(context, ref, competition), icon: const Icon(Icons.add), label: Text(competition.entryFee > 0 ? 'Join for ₹${competition.entryFee.toStringAsFixed(0)}' : 'Join for Free'), style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))));
  }

  Color _getStatusColor(CompetitionStatus status) {
    switch (status) { case CompetitionStatus.upcoming: return Colors.blue; case CompetitionStatus.active: return AppColors.success; case CompetitionStatus.completed: return Colors.grey; default: return AppColors.primary; }
  }

  String _getStatusText(CompetitionStatus status) {
    switch (status) { case CompetitionStatus.upcoming: return 'UPCOMING'; case CompetitionStatus.active: return 'LIVE'; case CompetitionStatus.completed: return 'ENDED'; default: return status.name.toUpperCase(); }
  }

  String _getTimeValue(CompetitionModel competition) {
    final now = DateTime.now();
    if (competition.status == CompetitionStatus.upcoming && competition.startDate != null) { final diff = competition.startDate!.difference(now); if (diff.inDays > 0) return '${diff.inDays}d'; if (diff.inHours > 0) return '${diff.inHours}h'; return '${diff.inMinutes}m'; }
    else if (competition.status == CompetitionStatus.active && competition.endDate != null) { final diff = competition.endDate!.difference(now); if (diff.inDays > 0) return '${diff.inDays}d'; if (diff.inHours > 0) return '${diff.inHours}h'; return '${diff.inMinutes}m'; }
    return '-';
  }

  String _getTimeLabel(CompetitionModel competition) {
    if (competition.status == CompetitionStatus.upcoming) return 'Starts in';
    if (competition.status == CompetitionStatus.active) return 'Ends in';
    return 'Ended';
  }

  Color _getTimeColor(CompetitionModel competition) {
    if (competition.status == CompetitionStatus.upcoming) return Colors.blue;
    if (competition.status == CompetitionStatus.active) return AppColors.warning;
    return Colors.grey;
  }

  String _formatAmount(double amount) {
    if (amount >= 100000) return '${(amount / 100000).toStringAsFixed(1)}L';
    if (amount >= 1000) return '${(amount / 1000).toStringAsFixed(1)}K';
    return amount.toStringAsFixed(0);
  }

  void _showOptions(BuildContext context) {
    showModalBottomSheet(context: context, builder: (context) => SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: [
      ListTile(leading: const Icon(Icons.share), title: const Text('Share'), onTap: () { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Share link copied!'))); }),
      ListTile(leading: const Icon(Icons.flag_outlined), title: const Text('Report'), onTap: () { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Report submitted'))); }),
    ])));
  }

  void _navigateToLeaderboard(BuildContext context) => Navigator.push(context, MaterialPageRoute(builder: (context) => LeaderboardPage(competitionId: competitionId)));
  void _navigateToParticipants(BuildContext context) => Navigator.push(context, MaterialPageRoute(builder: (context) => ParticipantsPage(competitionId: competitionId)));

  void _joinCompetition(BuildContext context, WidgetRef ref, CompetitionModel competition) {
    if (competition.entryFee > 0) {
      Navigator.push(context, MaterialPageRoute(builder: (context) => JoinCompetitionPage(competitionId: competitionId)));
    } else {
      ref.read(competitionDetailProvider(competitionId).notifier).joinCompetition(competitionId).then((success) {
        if (success) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Successfully joined!'))); }
        else { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to join. Please try again.'))); }
      });
    }
  }
}
