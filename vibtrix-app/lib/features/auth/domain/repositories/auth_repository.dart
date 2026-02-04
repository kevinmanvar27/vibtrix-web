import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../data/models/auth_models.dart';
import '../../data/models/user_model.dart';

/// Abstract repository interface for authentication operations
abstract class AuthRepository {
  /// Login with email and password
  Future<Result<AuthResponse>> login(LoginRequest request);

  /// Register a new user
  Future<Result<AuthResponse>> signup(SignupRequest request);

  /// Logout current user
  Future<Result<void>> logout();

  /// Refresh access token
  Future<Result<TokenResponse>> refreshToken(String refreshToken);

  /// Send email verification OTP
  Future<Result<void>> sendVerificationOtp(SendOtpRequest request);

  /// Verify email OTP
  Future<Result<void>> verifyEmailOtp(VerifyOtpRequest request);

  /// Request password reset
  Future<Result<void>> forgotPassword(ForgotPasswordRequest request);

  /// Verify password reset OTP and get reset token
  Future<Result<VerifyResetOtpResponse>> verifyResetOtp(VerifyResetOtpRequest request);

  /// Reset password with token
  Future<Result<void>> resetPassword(ResetPasswordRequest request);

  /// Change password
  Future<Result<void>> changePassword(ChangePasswordRequest request);

  /// Get current user profile
  Future<Result<UserModel>> getCurrentUser();

  /// Update user profile
  Future<Result<UserModel>> updateProfile(UpdateProfileRequest request);

  /// Update profile picture
  Future<Result<UserModel>> updateProfilePicture(List<int> imageBytes, String fileName);

  /// Delete profile picture
  Future<Result<void>> deleteProfilePicture();

  /// Verify email with token
  /// NOTE: This endpoint is not implemented. Use verifyEmailOtp instead.
  @Deprecated('Use verifyEmailOtp instead')
  Future<Result<void>> verifyEmail(String token);

  /// Resend email verification
  /// NOTE: This endpoint is not implemented. Use sendVerificationOtp instead.
  @Deprecated('Use sendVerificationOtp instead')
  Future<Result<void>> resendVerificationEmail();

  /// Check if username is available
  /// NOTE: This endpoint is not implemented in the backend API.
  @Deprecated('Backend API does not support username availability check')
  Future<Result<bool>> checkUsernameAvailability(String username);

  /// Check if email is available
  /// NOTE: This endpoint is not implemented in the backend API.
  @Deprecated('Backend API does not support email availability check')
  Future<Result<bool>> checkEmailAvailability(String email);

  /// Social login (Google, Apple, etc.)
  /// NOTE: Use googleMobileLogin or appleMobileLogin instead.
  @Deprecated('Use googleMobileLogin or appleMobileLogin instead')
  Future<Result<AuthResponse>> socialLogin(SocialLoginRequest request);

  /// Google mobile login (uses idToken from Google Sign-In SDK)
  Future<Result<AuthResponse>> googleMobileLogin(GoogleMobileLoginRequest request);

  /// Apple mobile login (uses idToken from Apple Sign-In SDK)
  Future<Result<AuthResponse>> appleMobileLogin(AppleMobileLoginRequest request);

  /// Get stored auth token
  Future<String?> getStoredToken();

  /// Check if user is authenticated
  Future<bool> isAuthenticated();

  /// Clear stored credentials
  Future<void> clearCredentials();
}
