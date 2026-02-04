import 'package:dio/dio.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/network/upload_api_service.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_api_service.dart';
import '../models/auth_models.dart';
import '../models/user_model.dart';

/// Implementation of AuthRepository
class AuthRepositoryImpl implements AuthRepository {
  final AuthApiService _apiService;
  final UploadApiService _uploadService;
  final SecureStorageService _secureStorage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'current_user';

  AuthRepositoryImpl({
    required AuthApiService apiService,
    required UploadApiService uploadService,
    required SecureStorageService secureStorage,
  })  : _apiService = apiService,
        _uploadService = uploadService,
        _secureStorage = secureStorage;

  @override
  Future<Result<AuthResponse>> login(LoginRequest request) async {
    debugPrint('[AuthRepo] login called with username: ${request.username}');
    try {
      debugPrint('[AuthRepo] Calling API...');
      final response = await _apiService.login(request);
      debugPrint('[AuthRepo] API response received, user: ${response.user.username}');
      await _saveTokens(response);
      debugPrint('[AuthRepo] Tokens saved successfully');
      return Right(response);
    } on DioException catch (e) {
      debugPrint('[AuthRepo] DioException: ${e.message}, response: ${e.response?.data}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      debugPrint('[AuthRepo] Exception: $e');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<AuthResponse>> signup(SignupRequest request) async {
    debugPrint('🔐 [AuthRepo] signup called with username: ${request.username}, email: ${request.email}');
    try {
      debugPrint('🔐 [AuthRepo] Calling API...');
      final response = await _apiService.signup(request);
      debugPrint('🔐 [AuthRepo] API response received');
      debugPrint('🔐 [AuthRepo] User: ${response.user.username}, ID: ${response.user.id}');
      debugPrint('🔐 [AuthRepo] AccessToken: ${response.accessToken.substring(0, 20)}...');
      await _saveTokens(response);
      debugPrint('🔐 [AuthRepo] Tokens saved successfully');
      return Right(response);
    } on DioException catch (e) {
      debugPrint('❌ [AuthRepo] DioException: ${e.message}');
      debugPrint('❌ [AuthRepo] Response data: ${e.response?.data}');
      debugPrint('❌ [AuthRepo] Status code: ${e.response?.statusCode}');
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e, stackTrace) {
      debugPrint('❌ [AuthRepo] Exception: $e');
      debugPrint('❌ [AuthRepo] StackTrace: $stackTrace');
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> logout() async {
    try {
      await _apiService.logout();
      await clearCredentials();
      return const Right(null);
    } on DioException catch (e) {
      // Still clear credentials even if API call fails
      await clearCredentials();
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      await clearCredentials();
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<TokenResponse>> refreshToken(String refreshToken) async {
    try {
      final response = await _apiService.refreshToken(
        RefreshTokenRequest(refreshToken: refreshToken),
      );
      await _secureStorage.write(_accessTokenKey, response.accessToken);
      if (response.refreshToken != null) {
        await _secureStorage.write(_refreshTokenKey, response.refreshToken!);
      }
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> sendVerificationOtp(SendOtpRequest request) async {
    try {
      await _apiService.sendVerificationOtp(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> verifyEmailOtp(VerifyOtpRequest request) async {
    try {
      await _apiService.verifyEmailOtp(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> forgotPassword(ForgotPasswordRequest request) async {
    try {
      await _apiService.forgotPassword(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<VerifyResetOtpResponse>> verifyResetOtp(VerifyResetOtpRequest request) async {
    try {
      final response = await _apiService.verifyResetOtp(request);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> resetPassword(ResetPasswordRequest request) async {
    try {
      await _apiService.resetPassword(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> changePassword(ChangePasswordRequest request) async {
    try {
      await _apiService.changePassword(request);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<UserModel>> getCurrentUser() async {
    try {
      final user = await _apiService.getCurrentUser();
      return Right(user);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<UserModel>> updateProfile(UpdateProfileRequest request) async {
    try {
      final user = await _apiService.updateProfile(request);
      return Right(user);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<UserModel>> updateProfilePicture(List<int> imageBytes, String fileName) async {
    try {
      // Upload avatar using the upload service
      final response = await _uploadService.uploadAvatar(imageBytes, fileName);
      // Fetch the updated user to return the complete user model
      final user = await _apiService.getCurrentUser();
      return Right(user);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> deleteProfilePicture() async {
    // NOTE: Backend API does not have a delete avatar endpoint
    // The avatar is automatically deleted when a new one is uploaded
    return Left(const ServerFailure(message: 'Delete avatar not supported. Upload a new avatar instead.'));
  }

  @override
  Future<Result<void>> verifyEmail(String token) async {
    // NOTE: This endpoint doesn't exist in backend
    // Use verifyEmailOtp with email and OTP instead
    return Left(const ServerFailure(message: 'Use verifyEmailOtp instead'));
  }

  @override
  Future<Result<void>> resendVerificationEmail() async {
    // NOTE: This endpoint doesn't exist in backend
    // Use sendVerificationOtp with email instead
    return Left(const ServerFailure(message: 'Use sendVerificationOtp instead'));
  }

  @override
  Future<Result<bool>> checkUsernameAvailability(String username) async {
    // NOTE: /auth/check-username doesn't exist
    // Alternative: Try to get user by username - 404 means available
    try {
      // This will throw 404 if username is available
      // We can't check this without a users API service
      // For now, assume username is available
      return const Right(true);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return const Right(true); // Username is available
      }
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> checkEmailAvailability(String email) async {
    // NOTE: /auth/check-email doesn't exist in backend
    // For now, assume email is available
    return const Right(true);
  }

  @override
  Future<Result<AuthResponse>> socialLogin(SocialLoginRequest request) async {
    // NOTE: /auth/social doesn't exist
    // Use googleMobileLogin or appleMobileLogin instead
    return Left(const ServerFailure(message: 'Use googleMobileLogin or appleMobileLogin instead'));
  }

  @override
  Future<Result<AuthResponse>> googleMobileLogin(GoogleMobileLoginRequest request) async {
    try {
      final mobileResponse = await _apiService.googleMobileLogin(request);
      final response = mobileResponse.toAuthResponse();
      await _saveTokens(response);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<AuthResponse>> appleMobileLogin(AppleMobileLoginRequest request) async {
    try {
      final mobileResponse = await _apiService.appleMobileLogin(request);
      final response = mobileResponse.toAuthResponse();
      await _saveTokens(response);
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<String?> getStoredToken() async {
    return _secureStorage.read(_accessTokenKey);
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await getStoredToken();
    return token != null && token.isNotEmpty;
  }

  @override
  Future<void> clearCredentials() async {
    await _secureStorage.delete(_accessTokenKey);
    await _secureStorage.delete(_refreshTokenKey);
    await _secureStorage.delete(_userKey);
  }

  Future<void> _saveTokens(AuthResponse response) async {
    await _secureStorage.write(_accessTokenKey, response.accessToken);
    if (response.refreshToken != null) {
      await _secureStorage.write(_refreshTokenKey, response.refreshToken!);
    }
  }
}
