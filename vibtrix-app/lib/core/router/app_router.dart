import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import 'route_names.dart';
import 'routes.dart';

/// Global navigator key for accessing navigator from anywhere
final rootNavigatorKey = GlobalKey<NavigatorState>();

/// Shell navigator key for bottom navigation
final shellNavigatorKey = GlobalKey<NavigatorState>();

/// Listenable that notifies when auth state changes
class AuthStateRefreshNotifier extends ChangeNotifier {
  AuthStateRefreshNotifier(Ref ref) {
    ref.listen(authStateProvider, (previous, next) {
      // Only notify when auth state actually changes
      if (previous?.isAuthenticated != next.isAuthenticated ||
          previous?.isInitialized != next.isInitialized) {
        notifyListeners();
      }
    });
  }
}

/// Provider for the GoRouter instance
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    debugLogDiagnostics: true,
    initialLocation: RouteNames.splash,
    
    // Refresh router when auth state changes
    refreshListenable: AuthStateRefreshNotifier(ref),
    
    // Redirect logic based on auth state
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      final isInitialized = authState.isInitialized;
      final currentPath = state.matchedLocation;
      
      // Don't redirect while loading or not initialized (except from splash)
      if (!isInitialized && currentPath == RouteNames.splash) return null;
      if (isLoading) return null;
      
      // Auth routes that don't require login
      final authRoutes = [
        RouteNames.splash,
        RouteNames.onboarding,
        RouteNames.login,
        RouteNames.register,
        RouteNames.forgotPassword,
        RouteNames.resetPassword,
        RouteNames.verifyOtp,
      ];
      
      final isAuthRoute = authRoutes.any((route) => currentPath.startsWith(route));
      
      // If not logged in and trying to access protected route, redirect to login
      if (!isLoggedIn && !isAuthRoute) {
        return RouteNames.login;
      }
      
      // If logged in and trying to access auth route (except splash), redirect to home
      if (isLoggedIn && isAuthRoute && currentPath != RouteNames.splash) {
        return RouteNames.home;
      }
      
      return null;
    },
    
    // Error page
    errorBuilder: (context, state) => ErrorPage(error: state.error),
    
    // Routes configuration
    routes: appRoutes,
  );
});

/// Error page widget
class ErrorPage extends StatelessWidget {
  final Exception? error;
  
  const ErrorPage({super.key, this.error});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline_rounded,
                size: 80,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 24),
              Text(
                'Page Not Found',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'The page you are looking for doesn\'t exist or has been moved.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              FilledButton.icon(
                onPressed: () => context.go(RouteNames.home),
                icon: const Icon(Icons.home_rounded),
                label: const Text('Go Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
