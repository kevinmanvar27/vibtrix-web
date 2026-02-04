import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'search_page.dart';

/// Page showing search results for a query
/// This page redirects to SearchPage with pre-filled query
class SearchResultsPage extends ConsumerWidget {
  final String query;
  
  const SearchResultsPage({
    super.key,
    required this.query,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Redirect to SearchPage which handles all search functionality
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => const SearchPage(),
        ),
      );
    });

    return Scaffold(
      appBar: AppBar(
        title: Text('Results for "$query"'),
      ),
      body: const Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
