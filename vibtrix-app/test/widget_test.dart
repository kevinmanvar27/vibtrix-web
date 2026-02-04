// This is a basic Flutter widget test for VidiBattle.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:vibtrix/app.dart';

void main() {
  testWidgets('VidiBattle app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: VidiBattleApp(),
      ),
    );

    // Wait for the splash screen
    await tester.pump();

    // Verify that the app renders without errors
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
