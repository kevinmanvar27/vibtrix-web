import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Page for reporting a post
class ReportPostPage extends ConsumerStatefulWidget {
  final String postId;
  
  const ReportPostPage({
    super.key,
    required this.postId,
  });

  @override
  ConsumerState<ReportPostPage> createState() => _ReportPostPageState();
}

class _ReportPostPageState extends ConsumerState<ReportPostPage> {
  String? _selectedReason;
  final _detailsController = TextEditingController();

  final _reasons = [
    'Spam',
    'Nudity or sexual content',
    'Violence or dangerous content',
    'Hate speech or symbols',
    'False information',
    'Intellectual property violation',
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
        title: const Text('Report Post'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Why are you reporting this post?',
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
