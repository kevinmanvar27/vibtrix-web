import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Splash screen shown when app launches
/// 
/// Handles:
/// - App initialization
/// - Auth state checking
/// - Navigation to appropriate screen
class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    
    // Setup animations
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    
    // Start animation
    _animationController.forward();
    
    // Navigate after delay
    _navigateToNextScreen();
  }

  Future<void> _navigateToNextScreen() async {
    debugPrint('[Splash] Starting navigation check...');
    
    // Wait for animation and minimum splash duration
    await Future.delayed(const Duration(milliseconds: 2000));
    
    if (!mounted) {
      debugPrint('[Splash] Widget not mounted, returning');
      return;
    }
    
    // Check if onboarding is complete
    final onboardingComplete = LocalStorage.isOnboardingComplete();
    debugPrint('[Splash] Onboarding complete: $onboardingComplete');
    
    if (!onboardingComplete) {
      debugPrint('[Splash] Navigating to onboarding...');
      context.go(RouteNames.onboarding);
      return;
    }
    
    // Wait for auth to be initialized (with timeout)
    debugPrint('[Splash] Waiting for auth initialization...');
    int attempts = 0;
    const maxAttempts = 30; // 3 seconds max wait
    while (!ref.read(authStateProvider).isInitialized && attempts < maxAttempts) {
      await Future.delayed(const Duration(milliseconds: 100));
      attempts++;
      if (!mounted) return;
    }
    debugPrint('[Splash] Auth initialized after $attempts attempts');
    
    // Check auth state
    final authState = ref.read(authStateProvider);
    debugPrint('[Splash] Auth state - isAuthenticated: ${authState.isAuthenticated}, isInitialized: ${authState.isInitialized}');
    
    if (authState.isAuthenticated) {
      debugPrint('[Splash] Navigating to home...');
      context.go(RouteNames.home);
    } else {
      debugPrint('[Splash] Navigating to login...');
      context.go(RouteNames.login);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    AppColors.primaryDark,
                    AppColors.primaryDark.withOpacity(0.8),
                  ]
                : [
                    AppColors.primary,
                    AppColors.primaryLight,
                  ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return FadeTransition(
                  opacity: _fadeAnimation,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Logo
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Icon(
                              Icons.play_circle_filled_rounded,
                              size: 80,
                              color: isDark 
                                  ? AppColors.primaryDark 
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        // App name
                        Text(
                          'VidiBattle',
                          style: theme.textTheme.headlineLarge?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        
                        // Tagline
                        Text(
                          'Battle. Create. Win.',
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withOpacity(0.9),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 48),
                        
                        // Loading indicator
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white.withOpacity(0.8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
