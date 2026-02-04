import 'package:json_annotation/json_annotation.dart';
import 'user_model.dart';

part 'auth_models.g.dart';

// ============ REQUEST MODELS ============

/// Request model for login
/// Backend expects: username, password
/// Backend endpoint: POST /api/auth/token
@JsonSerializable()
class LoginRequest {
  final String username;  // API expects username field
  final String password;
  final String? deviceId;
  final String? deviceType;
  final String? fcmToken;

  const LoginRequest({
    required this.username,
    required this.password,
    this.deviceId,
    this.deviceType,
    this.fcmToken,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) =>
      _$LoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
}

@JsonSerializable()
class SignupRequest {
  final String username;
  final String email;  // Required by backend
  final String? phone;
  final String password;
  final String? name;
  final String? referralCode;
  final String? deviceId;
  final String? deviceType;
  final String? fcmToken;

  const SignupRequest({
    required this.username,
    required this.email,  // Now required
    this.phone,
    required this.password,
    this.name,
    this.referralCode,
    this.deviceId,
    this.deviceType,
    this.fcmToken,
  });

  factory SignupRequest.fromJson(Map<String, dynamic> json) =>
      _$SignupRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SignupRequestToJson(this);
}

@JsonSerializable()
class RefreshTokenRequest {
  final String refreshToken;

  const RefreshTokenRequest({required this.refreshToken});

  factory RefreshTokenRequest.fromJson(Map<String, dynamic> json) =>
      _$RefreshTokenRequestFromJson(json);

  Map<String, dynamic> toJson() => _$RefreshTokenRequestToJson(this);
}

@JsonSerializable()
class ForgotPasswordRequest {
  final String? email;
  final String? phone;

  const ForgotPasswordRequest({this.email, this.phone});

  factory ForgotPasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$ForgotPasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ForgotPasswordRequestToJson(this);
}

@JsonSerializable()
class ResetPasswordRequest {
  final String token;
  final String newPassword;

  const ResetPasswordRequest({
    required this.token,
    required this.newPassword,
  });

  factory ResetPasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$ResetPasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ResetPasswordRequestToJson(this);
}

/// Request model for verifying password reset OTP
/// Used with /api/auth/verify-reset-otp endpoint
@JsonSerializable()
class VerifyResetOtpRequest {
  final String email;
  final String otp;

  const VerifyResetOtpRequest({
    required this.email,
    required this.otp,
  });

  factory VerifyResetOtpRequest.fromJson(Map<String, dynamic> json) =>
      _$VerifyResetOtpRequestFromJson(json);

  Map<String, dynamic> toJson() => _$VerifyResetOtpRequestToJson(this);
}

@JsonSerializable()
class VerifyOtpRequest {
  final String? email;
  final String? phone;
  final String otp;

  const VerifyOtpRequest({
    this.email,
    this.phone,
    required this.otp,
  });

  factory VerifyOtpRequest.fromJson(Map<String, dynamic> json) =>
      _$VerifyOtpRequestFromJson(json);

  Map<String, dynamic> toJson() => _$VerifyOtpRequestToJson(this);
}

@JsonSerializable()
class SendOtpRequest {
  final String? email;
  final String? phone;
  final String purpose; // 'login', 'signup', 'reset_password', 'verify'

  const SendOtpRequest({
    this.email,
    this.phone,
    required this.purpose,
  });

  factory SendOtpRequest.fromJson(Map<String, dynamic> json) =>
      _$SendOtpRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SendOtpRequestToJson(this);
}

@JsonSerializable()
class ChangePasswordRequest {
  final String currentPassword;
  final String newPassword;

  const ChangePasswordRequest({
    required this.currentPassword,
    required this.newPassword,
  });

  factory ChangePasswordRequest.fromJson(Map<String, dynamic> json) =>
      _$ChangePasswordRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ChangePasswordRequestToJson(this);
}

/// Request model for updating user profile
/// Matches backend PUT /api/users/me endpoint
/// Backend expects: displayName, username, bio, gender, whatsappNumber, dateOfBirth, etc.
@JsonSerializable()
class UpdateProfileRequest {
  final String? username;
  @JsonKey(name: 'displayName')
  final String? name;
  final String? bio;
  final String? gender;
  final String? whatsappNumber;
  final String? dateOfBirth;
  final String? upiId;
  final Map<String, dynamic>? socialLinks;
  // Privacy settings
  final bool? showOnlineStatus;
  final bool? isProfilePublic;
  final bool? showWhatsappNumber;
  final bool? showDob;
  final bool? hideYear;
  final bool? showUpiId;
  // Modeling features
  final bool? interestedInModeling;
  final double? photoshootPricePerDay;
  final bool? videoAdsParticipation;
  // Brand Ambassadorship
  final bool? interestedInBrandAmbassadorship;
  final double? brandAmbassadorshipPricing;
  final List<String>? brandPreferences;

  const UpdateProfileRequest({
    this.username,
    this.name,
    this.bio,
    this.gender,
    this.whatsappNumber,
    this.dateOfBirth,
    this.upiId,
    this.socialLinks,
    this.showOnlineStatus,
    this.isProfilePublic,
    this.showWhatsappNumber,
    this.showDob,
    this.hideYear,
    this.showUpiId,
    this.interestedInModeling,
    this.photoshootPricePerDay,
    this.videoAdsParticipation,
    this.interestedInBrandAmbassadorship,
    this.brandAmbassadorshipPricing,
    this.brandPreferences,
  });

  factory UpdateProfileRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateProfileRequestFromJson(json);

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (username != null) json['username'] = username;
    if (name != null) json['displayName'] = name;
    if (bio != null) json['bio'] = bio;
    if (gender != null) json['gender'] = gender;
    if (whatsappNumber != null) json['whatsappNumber'] = whatsappNumber;
    if (dateOfBirth != null) json['dateOfBirth'] = dateOfBirth;
    if (upiId != null) json['upiId'] = upiId;
    if (socialLinks != null) json['socialLinks'] = socialLinks;
    if (showOnlineStatus != null) json['showOnlineStatus'] = showOnlineStatus;
    if (isProfilePublic != null) json['isProfilePublic'] = isProfilePublic;
    if (showWhatsappNumber != null) json['showWhatsappNumber'] = showWhatsappNumber;
    if (showDob != null) json['showDob'] = showDob;
    if (hideYear != null) json['hideYear'] = hideYear;
    if (showUpiId != null) json['showUpiId'] = showUpiId;
    if (interestedInModeling != null) json['interestedInModeling'] = interestedInModeling;
    if (photoshootPricePerDay != null) json['photoshootPricePerDay'] = photoshootPricePerDay;
    if (videoAdsParticipation != null) json['videoAdsParticipation'] = videoAdsParticipation;
    if (interestedInBrandAmbassadorship != null) json['interestedInBrandAmbassadorship'] = interestedInBrandAmbassadorship;
    if (brandAmbassadorshipPricing != null) json['brandAmbassadorshipPricing'] = brandAmbassadorshipPricing;
    if (brandPreferences != null) json['brandPreferences'] = brandPreferences;
    return json;
  }
}

@JsonSerializable()
class VerifyEmailRequest {
  final String token;

  const VerifyEmailRequest({required this.token});

  factory VerifyEmailRequest.fromJson(Map<String, dynamic> json) =>
      _$VerifyEmailRequestFromJson(json);

  Map<String, dynamic> toJson() => _$VerifyEmailRequestToJson(this);
}

@JsonSerializable()
class SocialLoginRequest {
  final String provider; // 'google', 'apple', 'facebook'
  final String accessToken;
  final String? idToken;
  final String? deviceId;
  final String? deviceType;
  final String? fcmToken;

  const SocialLoginRequest({
    required this.provider,
    required this.accessToken,
    this.idToken,
    this.deviceId,
    this.deviceType,
    this.fcmToken,
  });

  factory SocialLoginRequest.fromJson(Map<String, dynamic> json) =>
      _$SocialLoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SocialLoginRequestToJson(this);
}

/// Request model for Google mobile authentication
/// Matches backend endpoint: POST /api/auth/google/mobile
@JsonSerializable()
class GoogleMobileLoginRequest {
  final String idToken;
  final String? accessToken;

  const GoogleMobileLoginRequest({
    required this.idToken,
    this.accessToken,
  });

  factory GoogleMobileLoginRequest.fromJson(Map<String, dynamic> json) =>
      _$GoogleMobileLoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$GoogleMobileLoginRequestToJson(this);
}

/// Request model for Apple mobile authentication
/// Matches backend endpoint: POST /api/auth/apple
@JsonSerializable()
class AppleMobileLoginRequest {
  final String idToken;
  final String? authorizationCode;
  final String? firstName;
  final String? lastName;

  const AppleMobileLoginRequest({
    required this.idToken,
    this.authorizationCode,
    this.firstName,
    this.lastName,
  });

  factory AppleMobileLoginRequest.fromJson(Map<String, dynamic> json) =>
      _$AppleMobileLoginRequestFromJson(json);

  Map<String, dynamic> toJson() => _$AppleMobileLoginRequestToJson(this);
}

// ============ RESPONSE MODELS ============

/// User data returned from login/auth endpoints
/// This matches the simplified user object returned by the backend
@JsonSerializable()
class AuthUser {
  final String id;
  final String username;
  @JsonKey(name: 'displayName')
  final String? name;
  @JsonKey(name: 'avatarUrl')
  final String? profilePicture;
  final String? role;

  const AuthUser({
    required this.id,
    required this.username,
    this.name,
    this.profilePicture,
    this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) =>
      _$AuthUserFromJson(json);

  Map<String, dynamic> toJson() => _$AuthUserToJson(this);

  /// Convert to full UserModel for app state
  UserModel toUserModel() {
    return UserModel(
      id: id,
      username: username,
      name: name,
      profilePicture: profilePicture,
      createdAt: DateTime.now(), // Backend doesn't return this for auth endpoints
    );
  }
}

/// Response from login/signup endpoints
/// Matches backend response: { accessToken, refreshToken, user }
@JsonSerializable()
class AuthResponse {
  final String accessToken;
  final String? refreshToken;
  final int? expiresIn;
  @JsonKey(fromJson: _userFromJson)
  final UserModel user;

  const AuthResponse({
    required this.accessToken,
    this.refreshToken,
    this.expiresIn,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

/// Custom JSON converter for user field that handles both formats
UserModel _userFromJson(Map<String, dynamic> json) {
  // The backend returns displayName/avatarUrl, but UserModel expects name/profilePicture
  // Handle both formats for compatibility
  return UserModel(
    id: json['id'] as String,
    username: json['username'] as String,
    // Handle both 'name' and 'displayName' fields
    name: json['name'] as String? ?? json['displayName'] as String?,
    // Handle both 'profilePicture' and 'avatarUrl' fields
    profilePicture: json['profilePicture'] as String? ?? json['avatarUrl'] as String?,
    email: json['email'] as String?,
    phone: json['phone'] as String?,
    bio: json['bio'] as String?,
    coverPicture: json['coverPicture'] as String?,
    isVerified: json['isVerified'] as bool? ?? false,
    isPrivate: json['isPrivate'] as bool? ?? false,
    followersCount: (json['followersCount'] as num?)?.toInt() ?? 0,
    followingCount: (json['followingCount'] as num?)?.toInt() ?? 0,
    postsCount: (json['postsCount'] as num?)?.toInt() ?? 0,
    totalLikes: (json['totalLikes'] as num?)?.toInt() ?? 0,
    // createdAt might not be returned by auth endpoints, use current time as fallback
    createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'] as String) 
        : DateTime.now(),
    updatedAt: json['updatedAt'] != null 
        ? DateTime.parse(json['updatedAt'] as String) 
        : null,
  );
}

/// User model for mobile auth response
/// Matches the simplified user object returned by /api/auth/google/mobile
@JsonSerializable()
class MobileAuthUser {
  final String id;
  final String username;
  @JsonKey(name: 'displayName')
  final String? name;
  @JsonKey(name: 'avatarUrl')
  final String? profilePicture;

  const MobileAuthUser({
    required this.id,
    required this.username,
    this.name,
    this.profilePicture,
  });

  factory MobileAuthUser.fromJson(Map<String, dynamic> json) =>
      _$MobileAuthUserFromJson(json);

  Map<String, dynamic> toJson() => _$MobileAuthUserToJson(this);

  /// Convert to full UserModel for app state
  UserModel toUserModel() {
    return UserModel(
      id: id,
      username: username,
      name: name,
      profilePicture: profilePicture,
      createdAt: DateTime.now(), // Backend doesn't return this for mobile auth
    );
  }
}

/// Response model for mobile authentication endpoints
/// Matches backend response: { user, accessToken, refreshToken }
@JsonSerializable()
class MobileAuthResponse {
  final String accessToken;
  final String refreshToken;
  final MobileAuthUser user;

  const MobileAuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory MobileAuthResponse.fromJson(Map<String, dynamic> json) =>
      _$MobileAuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$MobileAuthResponseToJson(this);

  /// Convert to standard AuthResponse for compatibility
  AuthResponse toAuthResponse() {
    return AuthResponse(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: user.toUserModel(),
    );
  }
}

@JsonSerializable()
class TokenResponse {
  final String accessToken;
  final String? refreshToken;
  final int? expiresIn;

  const TokenResponse({
    required this.accessToken,
    this.refreshToken,
    this.expiresIn,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) =>
      _$TokenResponseFromJson(json);

  Map<String, dynamic> toJson() => _$TokenResponseToJson(this);
}

@JsonSerializable()
class AvailabilityResponse {
  final bool available;
  final String? message;

  const AvailabilityResponse({
    required this.available,
    this.message,
  });

  factory AvailabilityResponse.fromJson(Map<String, dynamic> json) =>
      _$AvailabilityResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AvailabilityResponseToJson(this);
}

/// Response model for verify reset OTP
/// Returns the reset token to use for password reset
@JsonSerializable()
class VerifyResetOtpResponse {
  final String token;
  final String? message;

  const VerifyResetOtpResponse({
    required this.token,
    this.message,
  });

  factory VerifyResetOtpResponse.fromJson(Map<String, dynamic> json) =>
      _$VerifyResetOtpResponseFromJson(json);

  Map<String, dynamic> toJson() => _$VerifyResetOtpResponseToJson(this);
}
