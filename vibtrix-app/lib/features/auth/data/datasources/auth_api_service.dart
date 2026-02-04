import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/auth_models.dart';
import '../models/user_model.dart';

part 'auth_api_service.g.dart';

/// Auth API Service - Matches Backend API exactly
/// All endpoints verified against API_DOCUMENTATION.txt
@RestApi()
abstract class AuthApiService {
  factory AuthApiService(Dio dio, {String baseUrl}) = _AuthApiService;

  // ============ AUTHENTICATION ============

  /// POST /auth/token - Login with email/username and password
  @POST('/auth/token')
  Future<AuthResponse> login(@Body() LoginRequest request);

  /// POST /auth/signup - Register new user
  @POST('/auth/signup')
  Future<AuthResponse> signup(@Body() SignupRequest request);

  /// POST /auth/refresh - Refresh access token
  @POST('/auth/refresh')
  Future<TokenResponse> refreshToken(@Body() RefreshTokenRequest request);

  /// POST /auth/revoke - Logout (revoke tokens)
  @POST('/auth/revoke')
  Future<void> logout();

  // ============ EMAIL VERIFICATION ============

  /// POST /auth/send-verification-otp - Send OTP to email
  @POST('/auth/send-verification-otp')
  Future<void> sendVerificationOtp(@Body() SendOtpRequest request);

  /// POST /auth/verify-email-otp - Verify email with OTP
  @POST('/auth/verify-email-otp')
  Future<void> verifyEmailOtp(@Body() VerifyOtpRequest request);

  // ============ PASSWORD MANAGEMENT ============

  /// POST /auth/forgot-password - Request password reset
  @POST('/auth/forgot-password')
  Future<void> forgotPassword(@Body() ForgotPasswordRequest request);

  /// POST /auth/verify-reset-otp - Verify reset OTP
  @POST('/auth/verify-reset-otp')
  Future<VerifyResetOtpResponse> verifyResetOtp(@Body() VerifyResetOtpRequest request);

  /// POST /auth/reset-password - Reset password with token
  @POST('/auth/reset-password')
  Future<void> resetPassword(@Body() ResetPasswordRequest request);

  /// POST /users/change-password - Change password (authenticated)
  @POST('/users/change-password')
  Future<void> changePassword(@Body() ChangePasswordRequest request);

  // ============ SOCIAL LOGIN ============

  /// POST /auth/google/mobile - Google login for mobile
  @POST('/auth/google/mobile')
  Future<MobileAuthResponse> googleMobileLogin(@Body() GoogleMobileLoginRequest request);

  /// POST /auth/apple - Apple login
  @POST('/auth/apple')
  Future<MobileAuthResponse> appleMobileLogin(@Body() AppleMobileLoginRequest request);

  // ============ USER PROFILE ============

  /// GET /users/me - Get current user profile
  @GET('/users/me')
  Future<UserModel> getCurrentUser();

  /// PUT /users/me - Update user profile
  @PUT('/users/me')
  Future<UserModel> updateProfile(@Body() UpdateProfileRequest request);

  /// DELETE /users/me - Delete account
  @DELETE('/users/me')
  Future<void> deleteAccount();

  // ============ NOTE: These endpoints do NOT exist in backend ============
  // - GET /auth/check-username/{username} - Use /users/username/{username} instead (404 = available)
  // - GET /auth/check-email/{email} - Not implemented
  // - POST /auth/social - Use /auth/google/mobile or /auth/apple instead
  // - POST /auth/verify-email - Use /auth/verify-email-otp instead
}
