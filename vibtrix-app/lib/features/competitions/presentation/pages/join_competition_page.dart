import 'package:flutter/material.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/competition_model.dart';
import '../providers/competitions_provider.dart';

/// Page for joining a competition with entry fee payment
class JoinCompetitionPage extends ConsumerStatefulWidget {
  final String competitionId;
  
  const JoinCompetitionPage({
    super.key,
    required this.competitionId,
  });

  @override
  ConsumerState<JoinCompetitionPage> createState() => _JoinCompetitionPageState();
}

class _JoinCompetitionPageState extends ConsumerState<JoinCompetitionPage> {
  bool _isJoining = false;

  Future<void> _joinCompetition() async {
    setState(() => _isJoining = true);
    
    try {
      final notifier = ref.read(competitionDetailProvider(widget.competitionId).notifier);
      final success = await notifier.joinCompetition(widget.competitionId);
      
      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Successfully joined the competition!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop(true); // Return true to indicate success
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to join competition. Please try again.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _isJoining = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final competitionState = ref.watch(competitionDetailProvider(widget.competitionId));
    final competition = competitionState.competition;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Join Competition'),
      ),
      body: competitionState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : competitionState.error != null
              ? Center(child: Text('Error: ${competitionState.error}'))
              : competition == null
                  ? const Center(child: Text('Competition not found'))
                  : _buildContent(context, competition),
    );
  }

  Widget _buildContent(BuildContext context, CompetitionModel competition) {
    final entryFee = competition.entryFee;
    final isFree = entryFee == 0;
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    competition.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (competition.description != null)
                    Text(
                      competition.description!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Entry Fee'),
                      Text(
                        isFree ? 'FREE' : '₹$entryFee',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isFree ? Colors.green : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Prize Pool'),
                      Text(
                        '₹${competition.prizePool}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Participants'),
                      Text('${competition.participantsCount}/${competition.maxParticipants == 0 ? '∞' : competition.maxParticipants}'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isJoining ? null : _joinCompetition,
              child: _isJoining
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(isFree ? 'Join Competition' : 'Pay ₹$entryFee & Join'),
            ),
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text(
              'By joining, you agree to the competition rules',
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
