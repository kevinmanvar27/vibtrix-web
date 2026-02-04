import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/services/firebase_auth_service.dart';
import '../providers/auth_provider.dart';

/// Registration page for new users
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  bool _acceptedTerms = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    debugPrint('🔐 [RegisterPage] _handleRegister() called');
    if (!_formKey.currentState!.validate()) {
      debugPrint('🔐 [RegisterPage] Form validation failed');
      return;
    }
    
    if (!_acceptedTerms) {
      debugPrint('🔐 [RegisterPage] Terms not accepted');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the terms and conditions')),
      );
      return;
    }

    setState(() => _isLoading = true);
    debugPrint('🔐 [RegisterPage] Starting signup...');
    debugPrint('🔐 [RegisterPage] Username: ${_usernameController.text.trim()}');
    debugPrint('🔐 [RegisterPage] Email: ${_emailController.text.trim()}');

    try {
      final success = await ref.read(authProvider.notifier).signup(
        username: _usernameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      debugPrint('🔐 [RegisterPage] Signup returned: $success');
      
      if (mounted) {
        if (success) {
          debugPrint('✅ [RegisterPage] Registration successful! Router will redirect to home.');
          // Registration successful - router will redirect to home
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account created successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          // Router's redirect will automatically navigate to home when auth state changes
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          debugPrint('❌ [RegisterPage] Registration failed: $errorMessage');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMessage ?? 'Registration failed. Please try again.')),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ [RegisterPage] Exception during registration: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleGoogleSignUp() async {
    setState(() => _isGoogleLoading = true);

    try {
      // Step 1: Sign in with Google via Firebase Auth
      debugPrint('[RegisterPage] Starting Firebase Google Sign-In...');
      final firebaseAuthService = ref.read(firebaseAuthServiceProvider);
      final result = await firebaseAuthService.signInWithGoogle();

      if (!mounted) return;

      if (result.isCancelled) {
        debugPrint('[RegisterPage] User cancelled Google Sign-In');
        return;
      }

      if (!result.isSuccess) {
        debugPrint('[RegisterPage] Firebase Google Sign-In failed: ${result.error}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.error ?? 'Google Sign-Up failed')),
        );
        return;
      }

      debugPrint('[RegisterPage] Firebase Sign-In successful!');
      debugPrint('[RegisterPage] Email: ${result.email}');

      // Step 2: Send Firebase idToken to backend to create/login user
      debugPrint('[RegisterPage] Sending Firebase token to backend...');
      final success = await ref.read(authProvider.notifier).googleMobileLogin(
        idToken: result.idToken!,
      );

      if (mounted) {
        if (success) {
          debugPrint('[RegisterPage] Backend signup successful!');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Welcome, ${result.displayName ?? result.email}!'),
              backgroundColor: Colors.green,
            ),
          );
          // Router's redirect will automatically navigate to home
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          debugPrint('[RegisterPage] Backend signup failed: $errorMessage');
          // Sign out from Firebase since backend signup failed
          await firebaseAuthService.signOut();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMessage ?? 'Sign-up failed. Please try again.')),
          );
        }
      }
    } catch (e) {
      debugPrint('[RegisterPage] Exception during Google SignUp: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google Sign-Up error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.primaryDark : AppColors.primary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Google Sign-Up button at the top
                OutlinedButton.icon(
                  onPressed: _isGoogleLoading ? null : _handleGoogleSignUp,
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
                  label: Text(_isGoogleLoading ? 'Signing up...' : 'Sign up with Google'),
                ),
                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'or sign up with email',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 24),

                // Username field
                TextFormField(
                  controller: _usernameController,
                  textInputAction: TextInputAction.next,
                  validator: Validators.username,
                  decoration: const InputDecoration(
                    labelText: 'Username',
                    hintText: 'Choose a unique username',
                    prefixIcon: Icon(Icons.alternate_email),
                  ),
                ),
                const SizedBox(height: 16),

                // Email field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'Enter your email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: 16),

                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.next,
                  validator: Validators.passwordStrict,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Create a strong password',
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
                const SizedBox(height: 16),

                // Confirm password field
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Re-enter your password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() => _obscureConfirmPassword = !_obscureConfirmPassword);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Terms checkbox
                Row(
                  children: [
                    Checkbox(
                      value: _acceptedTerms,
                      onChanged: (value) {
                        setState(() => _acceptedTerms = value ?? false);
                      },
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _acceptedTerms = !_acceptedTerms);
                        },
                        child: Text.rich(
                          TextSpan(
                            text: 'I agree to the ',
                            children: [
                              TextSpan(
                                text: 'Terms of Service',
                                style: TextStyle(color: primaryColor),
                              ),
                              const TextSpan(text: ' and '),
                              TextSpan(
                                text: 'Privacy Policy',
                                style: TextStyle(color: primaryColor),
                              ),
                            ],
                          ),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Register button
                FilledButton(
                  onPressed: _isLoading ? null : _handleRegister,
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
                      : const Text('Create Account'),
                ),
                const SizedBox(height: 24),

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account? ',
                      style: theme.textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('Sign In'),
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
