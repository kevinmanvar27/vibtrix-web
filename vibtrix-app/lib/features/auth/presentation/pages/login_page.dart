import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/services/firebase_auth_service.dart';
import '../providers/auth_provider.dart';

/// Login page for user authentication
/// 
/// Supports:
/// - Email/Username + Password login (via backend API)
/// - Google Sign-In (via Firebase Auth -> Backend API)
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isGoogleLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Handle email/username + password login
  /// This goes directly to backend API
  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    debugPrint('[LoginPage] Email login started...');

    try {
      final success = await ref.read(authProvider.notifier).login(
        username: _usernameController.text.trim(),
        password: _passwordController.text,
      );
      
      if (mounted) {
        if (success) {
          debugPrint('[LoginPage] Login successful! Router will redirect to home.');
          // Router's redirect will automatically navigate to home when auth state changes
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          debugPrint('[LoginPage] Login failed: $errorMessage');
          _showError(errorMessage ?? 'Login failed. Please try again.');
        }
      }
    } catch (e) {
      debugPrint('[LoginPage] Exception during login: $e');
      if (mounted) {
        _showError('Login failed: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Handle Google Sign-In
  /// Flow: Firebase Auth -> Get idToken -> Backend API -> Save bearer token
  Future<void> _handleGoogleSignIn() async {
    setState(() => _isGoogleLoading = true);

    try {
      // Step 1: Sign in with Google via Firebase Auth
      debugPrint('[LoginPage] Starting Firebase Google Sign-In...');
      final firebaseAuthService = ref.read(firebaseAuthServiceProvider);
      final result = await firebaseAuthService.signInWithGoogle();

      if (!mounted) return;

      if (result.isCancelled) {
        debugPrint('[LoginPage] User cancelled Google Sign-In');
        return;
      }

      if (!result.isSuccess) {
        debugPrint('[LoginPage] Firebase Google Sign-In failed: ${result.error}');
        _showError(result.error ?? 'Google Sign-In failed');
        return;
      }

      debugPrint('[LoginPage] Firebase Sign-In successful!');
      debugPrint('[LoginPage] Email: ${result.email}');
      debugPrint('[LoginPage] Firebase idToken length: ${result.idToken?.length}');

      // Step 2: Send Firebase idToken to backend to get bearer token
      debugPrint('[LoginPage] Sending Firebase token to backend...');
      final success = await ref.read(authProvider.notifier).googleMobileLogin(
        idToken: result.idToken!,
      );

      if (mounted) {
        if (success) {
          debugPrint('[LoginPage] Backend login successful! Router will redirect.');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Welcome, ${result.displayName ?? result.email}!'),
              backgroundColor: Colors.green,
            ),
          );
          // Router's redirect will automatically navigate to home
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          debugPrint('[LoginPage] Backend login failed: $errorMessage');
          // Sign out from Firebase since backend login failed
          await firebaseAuthService.signOut();
          _showError(errorMessage ?? 'Sign-in failed. Please try again.');
        }
      }
    } catch (e) {
      debugPrint('[LoginPage] Exception during Google SignIn: $e');
      if (mounted) {
        _showError('Google Sign-In error: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.primaryDark : AppColors.primary;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                
                // Logo
                Icon(
                  Icons.play_circle_filled_rounded,
                  size: 80,
                  color: primaryColor,
                ),
                const SizedBox(height: 24),
                
                // Title
                Text(
                  'Welcome Back',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to continue battling',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Username field
                TextFormField(
                  controller: _usernameController,
                  keyboardType: TextInputType.text,
                  textInputAction: TextInputAction.next,
                  validator: Validators.required,
                  decoration: const InputDecoration(
                    labelText: 'Username or Email',
                    hintText: 'Enter your username or email',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 16),

                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  validator: Validators.required,
                  onFieldSubmitted: (_) => _handleLogin(),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Enter your password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push(RouteNames.forgotPassword),
                    child: const Text('Forgot Password?'),
                  ),
                ),
                const SizedBox(height: 24),

                // Login button
                FilledButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(56),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Sign In'),
                ),
                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'or',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 24),

                // Google Sign-In button
                OutlinedButton.icon(
                  onPressed: _isGoogleLoading ? null : _handleGoogleSignIn,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(56),
                  ),
                  icon: _isGoogleLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Image.network(
                          'https://www.google.com/favicon.ico',
                          height: 20,
                          width: 20,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.g_mobiledata, size: 24),
                        ),
                  label: Text(_isGoogleLoading ? 'Signing in...' : 'Continue with Google'),
                ),
                const SizedBox(height: 32),

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account? ",
                      style: theme.textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () => context.push(RouteNames.register),
                      child: const Text('Sign Up'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
