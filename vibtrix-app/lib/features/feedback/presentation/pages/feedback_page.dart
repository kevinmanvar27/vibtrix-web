import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Page for submitting app feedback
class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key});

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  final _feedbackController = TextEditingController();
  String _feedbackType = 'suggestion';
  int _rating = 0;

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Feedback'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'How would you rate your experience?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                return IconButton(
                  icon: Icon(
                    index < _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                    size: 36,
                  ),
                  onPressed: () {
                    setState(() => _rating = index + 1);
                  },
                );
              }),
            ),
            const SizedBox(height: 24),
            const Text(
              'Feedback Type',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'suggestion', label: Text('Suggestion')),
                ButtonSegment(value: 'bug', label: Text('Bug')),
                ButtonSegment(value: 'other', label: Text('Other')),
              ],
              selected: {_feedbackType},
              onSelectionChanged: (value) {
                setState(() => _feedbackType = value.first);
              },
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _feedbackController,
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: 'Your Feedback',
                border: OutlineInputBorder(),
                hintText: 'Tell us what you think...',
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _feedbackController.text.isNotEmpty
                    ? () {
                        // TODO: Submit feedback
                      }
                    : null,
                child: const Text('Submit Feedback'),
              ),
            ),
            const SizedBox(height: 16),
            const Center(
              child: Text(
                'Thank you for helping us improve!',
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
