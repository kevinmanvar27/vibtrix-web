import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/route_names.dart';
import '../providers/auth_provider.dart';

/// OTP verification page
/// Supports multiple verification types: email verification, password reset
class VerifyOtpPage extends ConsumerStatefulWidget {
  final String? email;
  final String? type; // 'reset_password', 'verify_email', etc.
  
  const VerifyOtpPage({super.key, this.email, this.type});

  @override
  ConsumerState<VerifyOtpPage> createState() => _VerifyOtpPageState();
}

class _VerifyOtpPageState extends ConsumerState<VerifyOtpPage> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  int _resendTimer = 60;
  bool _isResending = false;

  bool get _isPasswordReset => widget.type == 'reset_password';

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
        return true;
      }
      return false;
    });
  }

  String get _otp => _controllers.map((c) => c.text).join();

  Future<void> _handleVerify() async {
    if (_otp.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the complete 6-digit code')),
      );
      return;
    }

    if (widget.email == null || widget.email!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email not provided. Please go back and try again.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (_isPasswordReset) {
        // Verify reset OTP and get token
        final token = await ref.read(authProvider.notifier).verifyResetOtp(
          email: widget.email!,
          otp: _otp,
        );
        
        if (mounted) {
          if (token != null) {
            // Navigate to reset password page with the token
            context.go('${RouteNames.resetPassword}?token=$token');
          } else {
            final errorMessage = ref.read(authProvider).errorMessage;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(errorMessage ?? 'Invalid or expired code')),
            );
            // Clear the OTP fields
            _clearOtpFields();
          }
        }
      } else {
        // Email verification flow
        final success = await ref.read(authProvider.notifier).verifyEmailOtp(
          email: widget.email,
          otp: _otp,
        );
        
        if (mounted) {
          if (success) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Email verified successfully!'),
                backgroundColor: Colors.green,
              ),
            );
            context.go(RouteNames.home);
          } else {
            final errorMessage = ref.read(authProvider).errorMessage;
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(errorMessage ?? 'Verification failed')),
            );
            _clearOtpFields();
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verification failed: $e')),
        );
        _clearOtpFields();
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _clearOtpFields() {
    for (var controller in _controllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  Future<void> _handleResend() async {
    if (_resendTimer > 0 || widget.email == null) return;
    
    setState(() => _isResending = true);

    try {
      bool success;
      if (_isPasswordReset) {
        // Resend password reset OTP
        success = await ref.read(authProvider.notifier).forgotPassword(
          email: widget.email,
        );
      } else {
        // Resend email verification OTP
        success = await ref.read(authProvider.notifier).sendVerificationOtp(
          email: widget.email,
        );
      }
      
      if (mounted) {
        if (success) {
          setState(() => _resendTimer = 60);
          _startResendTimer();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Verification code resent successfully')),
          );
        } else {
          final errorMessage = ref.read(authProvider).errorMessage;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(errorMessage ?? 'Failed to resend code')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to resend code: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isResending = false);
      }
    }
  }

  void _handlePaste(String value) {
    // Handle pasting a 6-digit code
    final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length == 6) {
      for (int i = 0; i < 6; i++) {
        _controllers[i].text = digits[i];
      }
      _focusNodes[5].requestFocus();
      // Auto-verify after paste
      _handleVerify();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isPasswordReset ? 'Verify Code' : 'Verify Email'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Icon(
                _isPasswordReset ? Icons.lock_reset_rounded : Icons.mark_email_read_rounded,
                size: 80,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                _isPasswordReset ? 'Enter Reset Code' : 'Verify Your Email',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'We\'ve sent a 6-digit code to\n${widget.email ?? 'your email'}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              
              // OTP input fields
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 48,
                    child: TextFormField(
                      controller: _controllers[index],
                      focusNode: _focusNodes[index],
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 1,
                      style: theme.textTheme.headlineSmall,
                      decoration: const InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      onChanged: (value) {
                        // Handle paste
                        if (value.length > 1) {
                          _handlePaste(value);
                          return;
                        }
                        
                        if (value.isNotEmpty && index < 5) {
                          _focusNodes[index + 1].requestFocus();
                        } else if (value.isEmpty && index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                        
                        // Auto-verify when all digits are entered
                        if (_otp.length == 6) {
                          _handleVerify();
                        }
                      },
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),
              
              // Verify button
              FilledButton(
                onPressed: _isLoading ? null : _handleVerify,
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
                    : const Text('Verify'),
              ),
              const SizedBox(height: 24),
              
              // Resend button
              TextButton(
                onPressed: (_resendTimer == 0 && !_isResending) ? _handleResend : null,
                child: _isResending
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        _resendTimer > 0
                            ? 'Resend code in ${_resendTimer}s'
                            : 'Resend Code',
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
