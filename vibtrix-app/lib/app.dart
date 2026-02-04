import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/settings/presentation/providers/theme_provider.dart';

/// Main application widget
/// 
/// Configures:
/// - Material 3 theming with light/dark mode support
/// - GoRouter for navigation with deep linking
/// - Global error handling for widgets
class VidiBattleApp extends ConsumerWidget {
  const VidiBattleApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch theme mode from settings
    final themeMode = ref.watch(themeModeProvider);
    
    // Get router configuration
    final router = ref.watch(appRouterProvider);
    
    return MaterialApp.router(
      // App info
      title: 'VidiBattle',
      debugShowCheckedModeBanner: false,
      
      // Theme configuration
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      
      // Router configuration
      routerConfig: router,
      
      // Global error widget builder
      builder: (context, child) {
        // Add global error boundary
        return _GlobalErrorBoundary(
          child: MediaQuery(
            // Prevent text scaling from breaking layouts
            data: MediaQuery.of(context).copyWith(
              textScaler: TextScaler.linear(
                MediaQuery.of(context).textScaler.scale(1.0).clamp(0.8, 1.2),
              ),
            ),
            child: child ?? const SizedBox.shrink(),
          ),
        );
      },
    );
  }
}

/// Global error boundary widget
/// 
/// Catches widget build errors and displays a fallback UI
/// instead of crashing the entire app
class _GlobalErrorBoundary extends StatefulWidget {
  final Widget child;
  
  const _GlobalErrorBoundary({required this.child});
  
  @override
  State<_GlobalErrorBoundary> createState() => _GlobalErrorBoundaryState();
}

class _GlobalErrorBoundaryState extends State<_GlobalErrorBoundary> {
  bool _hasError = false;
  FlutterErrorDetails? _errorDetails;
  
  @override
  void initState() {
    super.initState();
    // Store original error handler
    final originalOnError = FlutterError.onError;
    
    // Set custom error handler
    FlutterError.onError = (FlutterErrorDetails details) {
      // Call original handler
      originalOnError?.call(details);
      
      // Update state to show error UI
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorDetails = details;
        });
      }
    };
  }
  
  void _retry() {
    setState(() {
      _hasError = false;
      _errorDetails = null;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return _ErrorFallbackWidget(
        errorDetails: _errorDetails,
        onRetry: _retry,
      );
    }
    
    return widget.child;
  }
}

/// Fallback widget shown when an error occurs
class _ErrorFallbackWidget extends StatelessWidget {
  final FlutterErrorDetails? errorDetails;
  final VoidCallback onRetry;
  
  const _ErrorFallbackWidget({
    this.errorDetails,
    required this.onRetry,
  });
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Error icon
                Icon(
                  Icons.error_outline_rounded,
                  size: 80,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 24),
                
                // Error title
                Text(
                  'Oops! Something went wrong',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                
                // Error description
                Text(
                  'We encountered an unexpected error. Please try again.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                
                // Retry button
                FilledButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Try Again'),
                ),
                
                // Show error details in debug mode
                if (errorDetails != null) ...[
                  const SizedBox(height: 32),
                  ExpansionTile(
                    title: const Text('Error Details'),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: SelectableText(
                          errorDetails!.exceptionAsString(),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
