import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Page for creating a new competition
class CreateCompetitionPage extends ConsumerStatefulWidget {
  const CreateCompetitionPage({super.key});

  @override
  ConsumerState<CreateCompetitionPage> createState() => _CreateCompetitionPageState();
}

class _CreateCompetitionPageState extends ConsumerState<CreateCompetitionPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _prizeController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _prizeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Competition'),
        actions: [
          TextButton(
            onPressed: _createCompetition,
            child: const Text('Create'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner image picker
              Container(
                height: 150,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('Add banner image'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Competition Title',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter a title';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                  hintText: 'Describe your competition...',
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _prizeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Prize Pool (₹)',
                  border: OutlineInputBorder(),
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 16),
              // Date pickers placeholder
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('Start Date'),
                subtitle: const Text('Tap to select'),
                onTap: () {
                  // TODO: Show date picker
                },
              ),
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('End Date'),
                subtitle: const Text('Tap to select'),
                onTap: () {
                  // TODO: Show date picker
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _createCompetition() {
    if (_formKey.currentState?.validate() ?? false) {
      // TODO: Create competition
    }
  }
}
