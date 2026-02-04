/// Auth state management using Riverpod
/// Handles authentication state, login, signup, logout, and token refresh

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../../core/error/failures.dart';
import '../../data/models/user_model.dart';
import '../../data/models/auth_models.dart';
import '../../domain/repositories/auth_repository.dart';

// ============================================================================
// Auth State
// ============================================================================

/// Represents the current authentication state
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserModel? user;
  final String? errorMessage;
  final bool isInitialized;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.errorMessage,
    this.isInitialized = false,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserModel? user,
    String? errorMessage,
    bool? isInitialized,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: clearUser ? null : (user ?? this.user),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }

  /// Initial state before checking auth
  factory AuthState.initial() => const AuthState();

  /// Loading state
  factory AuthState.loading() => const AuthState(isLoading: true);

  /// Authenticated state with user
  factory AuthState.authenticated(UserModel user) => AuthState(
        isAuthenticated: true,
        user: user,
        isInitialized: true,
      );

  /// Unauthenticated state
  factory AuthState.unauthenticated() => const AuthState(
        isAuthenticated: false,
        isInitialized: true,
      );

  /// Error state
  factory AuthState.error(String message) => AuthState(
        errorMessage: message,
        isInitialized: true,
      );
}

// ============================================================================
// Auth Notifier
// ============================================================================

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AuthState.initial()) {
    // Check auth status on initialization
    checkAuthStatus();
  }

  /// Check if user is authenticated on app start
  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, clearError: true);

    final isAuthenticated = await _repository.isAuthenticated();
    
    if (!isAuthenticated) {
      state = AuthState.unauthenticated();
      return;
    }

    final result = await _repository.getCurrentUser();

    result.fold(
      (failure) {
        // Not authenticated or error
        state = AuthState.unauthenticated();
      },
      (user) {
        state = AuthState.authenticated(user);
      },
    );
  }

  /// Login with username/email and password
  /// Note: Backend expects 'username' field - can be username or email
  Future<bool> login({
    required String username,  // API expects username field (can be username or email)
    required String password,
    String? deviceId,
    String? fcmToken,
  }) async {
    debugPrint('[AuthNotifier] login() called with username: $username');
    state = state.copyWith(isLoading: true, clearError: true);

    final request = LoginRequest(
      username: username,
      password: password,
      deviceId: deviceId,
      fcmToken: fcmToken,
    );
    
    debugPrint('[AuthNotifier] Calling repository.login()...');
    final result = await _repository.login(request);
    debugPrint('[AuthNotifier] Repository returned result');

    return result.fold(
      (failure) {
        debugPrint('[AuthNotifier] Login FAILED: ${failure.runtimeType} - ${_getErrorMessage(failure)}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (response) {
        debugPrint('[AuthNotifier] Login SUCCESS! User: ${response.user.username}');
        state = AuthState.authenticated(response.user);
        return true;
      },
    );
  }

  /// Register new user
  Future<bool> signup({
    required String username,
    required String email,  // Email is required by backend
    String? phone,
    required String password,
    String? name,
    String? referralCode,
    String? deviceId,
    String? fcmToken,
  }) async {
    debugPrint('🔐 [AuthNotifier] signup() called');
    debugPrint('🔐 [AuthNotifier] username: $username, email: $email');
    state = state.copyWith(isLoading: true, clearError: true);

    final request = SignupRequest(
      username: username,
      email: email,
      phone: phone,
      password: password,
      name: name,
      referralCode: referralCode,
      deviceId: deviceId,
      fcmToken: fcmToken,
    );
    
    debugPrint('🔐 [AuthNotifier] Calling repository.signup()...');
    final result = await _repository.signup(request);
    debugPrint('🔐 [AuthNotifier] Repository returned result');

    return result.fold(
      (failure) {
        debugPrint('❌ [AuthNotifier] Signup FAILED: ${failure.runtimeType} - ${_getErrorMessage(failure)}');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (response) {
        debugPrint('✅ [AuthNotifier] Signup SUCCESS!');
        debugPrint('✅ [AuthNotifier] User ID: ${response.user.id}');
        debugPrint('✅ [AuthNotifier] Username: ${response.user.username}');
        debugPrint('✅ [AuthNotifier] Name: ${response.user.name}');
        debugPrint('✅ [AuthNotifier] Email: ${response.user.email}');
        debugPrint('✅ [AuthNotifier] AccessToken received: ${response.accessToken.isNotEmpty}');
        debugPrint('✅ [AuthNotifier] RefreshToken received: ${response.refreshToken?.isNotEmpty ?? false}');
        state = AuthState.authenticated(response.user);
        return true;
      },
    );
  }

  /// Social login (Google, Apple, Facebook)
  /// NOTE: This method is deprecated. Use googleMobileLogin or appleMobileLogin instead.
  /// The generic /auth/social endpoint does not exist in the backend.
  @Deprecated('Use googleMobileLogin or appleMobileLogin instead')
  Future<bool> socialLogin({
    required String provider,
    required String accessToken,
    String? idToken,
    String? deviceId,
    String? fcmToken,
  }) async {
    // Redirect to appropriate mobile login based on provider
    if (provider.toLowerCase() == 'google' && idToken != null) {
      return googleMobileLogin(idToken: idToken, accessToken: accessToken);
    } else if (provider.toLowerCase() == 'apple' && idToken != null) {
      return appleMobileLogin(idToken: idToken);
    }
    
    // If we can't redirect, return error
    state = state.copyWith(
      isLoading: false,
      errorMessage: 'Social login not supported. Please use Google or Apple sign-in.',
    );
    return false;
  }

  /// Google mobile login using idToken from Google Sign-In SDK
  /// This uses the dedicated /api/auth/google/mobile endpoint
  Future<bool> googleMobileLogin({
    required String idToken,
    String? accessToken,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = GoogleMobileLoginRequest(
      idToken: idToken,
      accessToken: accessToken,
    );
    final result = await _repository.googleMobileLogin(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (response) {
        state = AuthState.authenticated(response.user);
        return true;
      },
    );
  }

  /// Apple mobile login using idToken from Apple Sign-In SDK
  /// This uses the dedicated /api/auth/apple endpoint
  Future<bool> appleMobileLogin({
    required String idToken,
    String? authorizationCode,
    String? firstName,
    String? lastName,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = AppleMobileLoginRequest(
      idToken: idToken,
      authorizationCode: authorizationCode,
      firstName: firstName,
      lastName: lastName,
    );
    final result = await _repository.appleMobileLogin(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (response) {
        state = AuthState.authenticated(response.user);
        return true;
      },
    );
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);

    await _repository.logout();

    state = AuthState.unauthenticated();
  }

  /// Send email verification OTP
  Future<bool> sendVerificationOtp({
    String? email,
  }) async {
    debugPrint('=== sendVerificationOtp called with email: $email ===');
    state = state.copyWith(isLoading: true, clearError: true);

    final request = SendOtpRequest(
      email: email,
      purpose: 'verify',
    );
    debugPrint('=== Sending request: ${request.toJson()} ===');
    final result = await _repository.sendVerificationOtp(request);

    return result.fold(
      (failure) {
        debugPrint('=== sendVerificationOtp FAILED: ${_getErrorMessage(failure)} ===');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        debugPrint('=== sendVerificationOtp SUCCESS ===');
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  /// Verify email OTP
  Future<bool> verifyEmailOtp({
    String? email,
    required String otp,
  }) async {
    debugPrint('=== verifyEmailOtp called with email: $email, otp: $otp ===');
    state = state.copyWith(isLoading: true, clearError: true);

    final request = VerifyOtpRequest(
      email: email,
      otp: otp,
    );
    debugPrint('=== Sending request: ${request.toJson()} ===');
    final result = await _repository.verifyEmailOtp(request);

    return result.fold(
      (failure) {
        debugPrint('=== verifyEmailOtp FAILED: ${_getErrorMessage(failure)} ===');
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        debugPrint('=== verifyEmailOtp SUCCESS ===');
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  /// Request password reset
  Future<bool> forgotPassword({String? email, String? phone}) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = ForgotPasswordRequest(email: email, phone: phone);
    final result = await _repository.forgotPassword(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  /// Verify password reset OTP and get reset token
  /// Returns the reset token on success, null on failure
  Future<String?> verifyResetOtp({
    required String email,
    required String otp,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = VerifyResetOtpRequest(email: email, otp: otp);
    final result = await _repository.verifyResetOtp(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return null;
      },
      (response) {
        state = state.copyWith(isLoading: false);
        return response.token;
      },
    );
  }

  /// Reset password with token
  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = ResetPasswordRequest(token: token, newPassword: newPassword);
    final result = await _repository.resetPassword(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  /// Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = ChangePasswordRequest(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
    final result = await _repository.changePassword(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        state = state.copyWith(isLoading: false);
        return true;
      },
    );
  }

  /// Update user profile
  /// Matches backend PUT /api/users/me endpoint
  Future<bool> updateProfile({
    String? username,
    String? name,
    String? bio,
    String? gender,
    String? whatsappNumber,
    String? dateOfBirth,
    String? upiId,
    Map<String, dynamic>? socialLinks,
    bool? showOnlineStatus,
    bool? isProfilePublic,
    bool? showWhatsappNumber,
    bool? showDob,
    bool? hideYear,
    bool? showUpiId,
    bool? interestedInModeling,
    double? photoshootPricePerDay,
    bool? videoAdsParticipation,
    bool? interestedInBrandAmbassadorship,
    double? brandAmbassadorshipPricing,
    List<String>? brandPreferences,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final request = UpdateProfileRequest(
      username: username,
      name: name,
      bio: bio,
      gender: gender,
      whatsappNumber: whatsappNumber,
      dateOfBirth: dateOfBirth,
      upiId: upiId,
      socialLinks: socialLinks,
      showOnlineStatus: showOnlineStatus,
      isProfilePublic: isProfilePublic,
      showWhatsappNumber: showWhatsappNumber,
      showDob: showDob,
      hideYear: hideYear,
      showUpiId: showUpiId,
      interestedInModeling: interestedInModeling,
      photoshootPricePerDay: photoshootPricePerDay,
      videoAdsParticipation: videoAdsParticipation,
      interestedInBrandAmbassadorship: interestedInBrandAmbassadorship,
      brandAmbassadorshipPricing: brandAmbassadorshipPricing,
      brandPreferences: brandPreferences,
    );
    final result = await _repository.updateProfile(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (user) {
        state = state.copyWith(isLoading: false, user: user);
        return true;
      },
    );
  }

  /// Update profile picture
  Future<bool> updateProfilePicture(List<int> imageBytes, String fileName) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.updateProfilePicture(imageBytes, fileName);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (user) {
        state = state.copyWith(isLoading: false, user: user);
        return true;
      },
    );
  }

  /// Delete profile picture
  Future<bool> deleteProfilePicture() async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.deleteProfilePicture();

    return result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: _getErrorMessage(failure),
        );
        return false;
      },
      (_) {
        // Update user with null profile picture
        if (state.user != null) {
          state = state.copyWith(
            isLoading: false,
            user: state.user!.copyWith(profilePicture: null),
          );
        } else {
          state = state.copyWith(isLoading: false);
        }
        return true;
      },
    );
  }

  /// Check username availability
  /// NOTE: Backend does not have username availability endpoint.
  /// Always returns true (assume available) - validation happens on signup.
  @Deprecated('Backend API does not support username availability check')
  Future<bool> checkUsernameAvailability(String username) async {
    // Backend doesn't have this endpoint - assume available
    // Actual validation will happen during signup
    debugPrint('[AuthProvider] checkUsernameAvailability called but endpoint not available');
    return true;
  }

  /// Check email availability
  /// NOTE: Backend does not have email availability endpoint.
  /// Always returns true (assume available) - validation happens on signup.
  @Deprecated('Backend API does not support email availability check')
  Future<bool> checkEmailAvailability(String email) async {
    // Backend doesn't have this endpoint - assume available
    // Actual validation will happen during signup
    debugPrint('[AuthProvider] checkEmailAvailability called but endpoint not available');
    return true;
  }

  /// Clear error message
  void clearError() {
    state = state.copyWith(clearError: true);
  }

  /// Convert failure to user-friendly message
  String _getErrorMessage(Failure failure) {
    if (failure is AuthFailure) {
      return failure.message ?? 'Authentication failed. Please try again.';
    } else if (failure is ValidationFailure) {
      return failure.message ?? 'Please check your input and try again.';
    } else if (failure is NetworkFailure) {
      return 'No internet connection. Please check your network.';
    } else if (failure is ServerFailure) {
      return 'Server error. Please try again later.';
    }
    return failure.message ?? 'An unexpected error occurred.';
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});

/// Alias for authProvider - used by router and splash screen
/// This provides backward compatibility with existing code
final authStateProvider = authProvider;

/// Current user provider (convenience)
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

/// Is authenticated provider (convenience)
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

/// Auth loading provider (convenience)
final authLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isLoading;
});

/// Auth error provider (convenience)
final authErrorProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).errorMessage;
});

/// Auth initialized provider - useful for splash screen
final authInitializedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isInitialized;
});

/// Username availability check provider
/// NOTE: Backend does not support this - always returns true
@Deprecated('Backend API does not support username availability check')
final usernameAvailabilityProvider = FutureProvider.family<bool, String>((ref, username) async {
  if (username.isEmpty || username.length < 3) return false;
  // Backend doesn't have this endpoint - assume available
  return true;
});

/// Email availability check provider
/// NOTE: Backend does not support this - always returns true
@Deprecated('Backend API does not support email availability check')
final emailAvailabilityProvider = FutureProvider.family<bool, String>((ref, email) async {
  if (email.isEmpty || !email.contains('@')) return false;
  // Backend doesn't have this endpoint - assume available
  return true;
});
