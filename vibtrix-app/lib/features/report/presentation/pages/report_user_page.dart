import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Page for reporting a user
class ReportUserPage extends ConsumerStatefulWidget {
  final String userId;
  
  const ReportUserPage({
    super.key,
    required this.userId,
  });

  @override
  ConsumerState<ReportUserPage> createState() => _ReportUserPageState();
}

class _ReportUserPageState extends ConsumerState<ReportUserPage> {
  String? _selectedReason;
  final _detailsController = TextEditingController();

  final _reasons = [
    'Spam',
    'Harassment or bullying',
    'Hate speech',
    'Impersonation',
    'Inappropriate content',
    'Scam or fraud',
    'Other',
  ];

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report User'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Why are you reporting this user?',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ..._reasons.map((reason) {
            return RadioListTile<String>(
              title: Text(reason),
              value: reason,
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
            onPressed: _selectedReason != null
                ? () {
                    // TODO: Submit report
                  }
                : null,
            child: const Text('Submit Report'),
          ),
        ],
      ),
    );
  }
}
