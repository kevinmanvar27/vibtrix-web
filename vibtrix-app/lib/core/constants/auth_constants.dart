/// Authentication Constants for VidiBattle
/// Contains OAuth client IDs and configuration
class AuthConstants {
  AuthConstants._();

  // ============ GOOGLE OAUTH CONFIGURATION ============
  
  /// Google OAuth Web Client ID (used for backend verification and as serverClientId)
  /// This is the "Web application" client ID from Google Cloud Console
  static const String googleWebClientId = 
      '937435569832-71ikcpad08a12460mckr8unerjn1j4rs.apps.googleusercontent.com';
  
  /// Google OAuth iOS Client ID
  /// This is the "iOS" client ID from Google Cloud Console
  /// Note: Using the Android client ID for now - create iOS client if needed
  static const String googleIosClientId = 
      '937435569832-26pc272h78pqkg0ekdcp2s8plg43kfd3.apps.googleusercontent.com';
  
  /// Google OAuth Android Client ID
  /// This is the "Android" client ID from Google Cloud Console
  /// Created with package name: com.rektech.vibtrix
  /// SHA-1: D9:F4:E9:6E:72:1D:44:3F:D7:88:52:E3:7A:2D:C1:2C:53:8A:E5:51
  static const String googleAndroidClientId = 
      '937435569832-26pc272h78pqkg0ekdcp2s8plg43kfd3.apps.googleusercontent.com';
  
  /// Google Sign-In scopes
  static const List<String> googleScopes = [
    'email',
    'profile',
    'openid',
  ];

  // ============ GOOGLE PROJECT INFO ============
  
  /// Google Cloud Project ID
  static const String googleProjectId = 'vibtrix';

  // ============ API ENDPOINTS ============
  
  /// Google Sign-In endpoint for mobile
  static const String googleMobileAuthEndpoint = '/auth/google/mobile';
  
  /// Apple Sign-In endpoint for mobile
  static const String appleMobileAuthEndpoint = '/auth/apple/mobile';
  
  /// Social login endpoint
  /// NOTE: This endpoint does not exist. Use googleMobileAuthEndpoint or appleMobileAuthEndpoint instead.
  @Deprecated('Use googleMobileAuthEndpoint or appleMobileAuthEndpoint instead')
  static const String socialLoginEndpoint = '/auth/social';
}