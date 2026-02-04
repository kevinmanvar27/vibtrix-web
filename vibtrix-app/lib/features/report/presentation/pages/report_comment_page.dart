import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/models/report_model.dart';
import '../providers/report_provider.dart';

/// Page for reporting a comment
class ReportCommentPage extends ConsumerStatefulWidget {
  final String commentId;
  
  const ReportCommentPage({
    super.key,
    required this.commentId,
  });

  @override
  ConsumerState<ReportCommentPage> createState() => _ReportCommentPageState();
}

class _ReportCommentPageState extends ConsumerState<ReportCommentPage> {
  ReportReason? _selectedReason;
  final _detailsController = TextEditingController();

  // Map display text to ReportReason enum
  final Map<String, ReportReason> _reasonsMap = {
    'Spam': ReportReason.spam,
    'Harassment': ReportReason.harassment,
    'Hate speech': ReportReason.hateSpeech,
    'Inappropriate content': ReportReason.nudity,
    'Other': ReportReason.other,
  };

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedReason == null) return;

    final success = await ref.read(reportProvider.notifier).reportComment(
      commentId: widget.commentId,
      reason: _selectedReason!,
      description: _detailsController.text.isNotEmpty 
          ? _detailsController.text 
          : null,
    );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      } else {
        final state = ref.read(reportProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(state.errorMessage ?? 'Failed to submit report'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reportState = ref.watch(reportProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Comment'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Why are you reporting this comment?',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ..._reasonsMap.entries.map((entry) {
            return RadioListTile<ReportReason>(
              title: Text(entry.key),
              value: entry.value,
              groupValue: _selectedReason,
              onChanged: (value) {
                setState(() => _selectedReason = value);
              },
            );
          }),
          const SizedBox(height: 16),
          TextField(
            controller: _detailsController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Additional details (optional)',
              border: OutlineInputBorder(),
              hintText: 'Provide more context...',
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _selectedReason != null && !reportState.isSubmitting
                ? _submitReport
                : null,
            child: reportState.isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Submit Report'),
          ),
        ],
      ),
    );
  }
}
