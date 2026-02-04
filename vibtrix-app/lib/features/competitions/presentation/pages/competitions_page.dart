import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_provider.dart';
import 'competition_detail_page.dart';
import 'create_competition_page.dart';

/// Main competitions listing page - CONNECTED TO REAL API
class CompetitionsPage extends ConsumerStatefulWidget {
  const CompetitionsPage({super.key});

  @override
  ConsumerState<CompetitionsPage> createState() => _CompetitionsPageState();
}

class _CompetitionsPageState extends ConsumerState<CompetitionsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    // Load competitions when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(competitionsListProvider.notifier).loadCompetitions();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final competitionsState = ref.watch(competitionsListProvider);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('Competitions'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => _navigateToCreate(),
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => _showMyCompetitions(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: theme.colorScheme.onSurface,
          unselectedLabelColor: theme.colorScheme.onSurface.withValues(alpha: 0.5),
          tabs: const [
            Tab(text: 'Active'),
            Tab(text: 'Voting'),
            Tab(text: 'Upcoming'),
            Tab(text: 'Ended'),
          ],
        ),
      ),
      body: competitionsState.isLoading && competitionsState.competitions.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : competitionsState.error != null && competitionsState.competitions.isEmpty
              ? _buildErrorState(competitionsState.error!)
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildCompetitionsList(_filterByStatus(competitionsState.competitions, CompetitionStatus.active)),
                    _buildCompetitionsList(_filterByStatus(competitionsState.competitions, CompetitionStatus.voting)),
                    _buildCompetitionsList(_filterByStatus(competitionsState.competitions, CompetitionStatus.upcoming)),
                    _buildCompetitionsList(_filterByStatus(competitionsState.competitions, CompetitionStatus.completed)),
                  ],
                ),
    );
  }

  List<CompetitionModel> _filterByStatus(List<CompetitionModel> competitions, CompetitionStatus status) {
    return competitions.where((c) => c.status == status).toList();
  }

  Widget _buildCompetitionsList(List<CompetitionModel> competitions) {
    if (competitions.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(competitionsListProvider.notifier).refresh(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: competitions.length,
        itemBuilder: (context, index) {
          final competition = competitions[index];
          return _CompetitionCard(
            competition: competition,
            onTap: () => _navigateToDetail(competition),
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
          const Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text(
            'No competitions found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check back later for new competitions',
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _navigateToCreate,
            icon: const Icon(Icons.add),
            label: const Text('Create Competition'),
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
          const Text(
            'Error loading competitions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Text(error, style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => ref.read(competitionsListProvider.notifier).loadCompetitions(),
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

  void _navigateToDetail(CompetitionModel competition) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CompetitionDetailPage(competitionId: competition.id),
      ),
    );
  }

  void _navigateToCreate() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CreateCompetitionPage()),
    );
  }

  void _showMyCompetitions() {
    // Note: My Competitions endpoint is not implemented in backend
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.4,
        minChildSize: 0.3,
        maxChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text(
                    'My Competitions',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            const Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.construction, size: 48, color: Colors.grey),
                    SizedBox(height: 16),
                    Text(
                      'Coming Soon',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'This feature is not yet available',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Competition card widget
class _CompetitionCard extends StatelessWidget {
  final CompetitionModel competition;
  final VoidCallback onTap;

  const _CompetitionCard({
    required this.competition,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      clipBehavior: Clip.antiAlias,
      color: isDark ? AppColors.darkMuted : Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail
            Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: competition.thumbnailUrl ?? '',
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 160,
                    color: AppColors.primary.withValues(alpha: 0.2),
                    child: const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 160,
                    color: AppColors.primary.withValues(alpha: 0.2),
                    child: const Icon(Icons.emoji_events, size: 64, color: AppColors.primary),
                  ),
                ),
                // Status badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(competition.status),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _getStatusText(competition.status),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                // Featured badge
                if (competition.isFeatured)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.amber,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.star, color: Colors.white, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Featured',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Joined indicator
                if (competition.isParticipating)
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check, color: Colors.white, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Joined',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    competition.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (competition.description != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      competition.description!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Stats row
                  Row(
                    children: [
                      _buildStatChip(
                        Icons.people,
                        '${competition.participantsCount}${(competition.maxParticipants ?? 0) > 0 ? "/${competition.maxParticipants}" : ""}',
                        theme,
                      ),
                      const SizedBox(width: 12),
                      _buildStatChip(
                        Icons.emoji_events,
                        '₹${_formatAmount(competition.prizePool?.toDouble() ?? 0)}',
                        theme,
                        color: AppColors.warning,
                      ),
                      const Spacer(),
                      _buildTimeChip(competition, theme),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String text, ThemeData theme, {Color? color}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color ?? Colors.grey),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: color ?? theme.colorScheme.onSurface.withValues(alpha: 0.6),
            fontWeight: color != null ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }

  Widget _buildTimeChip(CompetitionModel competition, ThemeData theme) {
    final now = DateTime.now();
    String timeText;
    Color color;

    if (competition.status == CompetitionStatus.upcoming && competition.startDate != null) {
      final diff = competition.startDate!.difference(now);
      timeText = 'Starts in ${_formatDuration(diff)}';
      color = Colors.blue;
    } else if (competition.status == CompetitionStatus.completed) {
      timeText = 'Ended';
      color = Colors.grey;
    } else if (competition.endDate != null) {
      final diff = competition.endDate!.difference(now);
      if (diff.isNegative) {
        timeText = 'Ended';
        color = Colors.grey;
      } else {
        timeText = '${_formatDuration(diff)} left';
        color = diff.inDays < 1 ? AppColors.error : AppColors.success;
      }
    } else {
      timeText = 'Active';
      color = AppColors.success;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.timer, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            timeText,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(CompetitionStatus status) {
    switch (status) {
      case CompetitionStatus.active:
        return AppColors.success;
      case CompetitionStatus.voting:
        return AppColors.warning;
      case CompetitionStatus.upcoming:
        return Colors.blue;
      case CompetitionStatus.completed:
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(CompetitionStatus status) {
    switch (status) {
      case CompetitionStatus.active:
        return 'LIVE';
      case CompetitionStatus.voting:
        return 'VOTING';
      case CompetitionStatus.upcoming:
        return 'UPCOMING';
      case CompetitionStatus.completed:
        return 'ENDED';
      default:
        return status.name.toUpperCase();
    }
  }

  String _formatAmount(double amount) {
    if (amount >= 100000) {
      return '${(amount / 100000).toStringAsFixed(1)}L';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    }
    return amount.toStringAsFixed(0);
  }

  String _formatDuration(Duration duration) {
    if (duration.inDays > 0) {
      return '${duration.inDays}d';
    } else if (duration.inHours > 0) {
      return '${duration.inHours}h';
    } else if (duration.inMinutes > 0) {
      return '${duration.inMinutes}m';
    }
    return 'soon';
  }
}
