import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../constants/auth_constants.dart';

/// Service for handling Google Sign-In
class GoogleSignInService {
  late final GoogleSignIn _googleSignIn;

  GoogleSignInService() {
    // Configure Google Sign-In based on platform
    // Android: Uses OAuth client configured in Google Cloud Console (based on SHA-1)
    //          Don't pass clientId for Android - it uses the one from google-services.json
    //          or the one configured in Google Cloud Console
    // iOS/Web: Need to pass the clientId explicitly
    
    if (kIsWeb) {
      // Web platform
      _googleSignIn = GoogleSignIn(
        clientId: AuthConstants.googleWebClientId,
        scopes: AuthConstants.googleScopes,
      );
    } else if (Platform.isIOS) {
      // iOS platform
      _googleSignIn = GoogleSignIn(
        clientId: AuthConstants.googleIosClientId,
        serverClientId: AuthConstants.googleWebClientId,
        scopes: AuthConstants.googleScopes,
      );
    } else {
      // Android platform
      // For Android, we use serverClientId which is the web client ID
      // The Android client is configured in Google Cloud Console with SHA-1
      // and is automatically used based on the app's package name and signing key
      _googleSignIn = GoogleSignIn(
        serverClientId: AuthConstants.googleWebClientId,
        scopes: AuthConstants.googleScopes,
      );
    }
  }

  /// Sign in with Google
  /// Returns the ID token for backend verification
  Future<GoogleSignInResult> signIn() async {
    try {
      debugPrint('[GoogleSignIn] Starting sign-in process...');
      
      // Sign out first to ensure fresh login
      await _googleSignIn.signOut();
      debugPrint('[GoogleSignIn] Previous session cleared');
      
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      
      if (account == null) {
        debugPrint('[GoogleSignIn] User cancelled sign-in');
        return GoogleSignInResult.cancelled();
      }

      debugPrint('[GoogleSignIn] Account selected: ${account.email}');
      
      final GoogleSignInAuthentication auth = await account.authentication;
      debugPrint('[GoogleSignIn] Got authentication, idToken: ${auth.idToken != null ? "present" : "null"}');
      
      if (auth.idToken == null) {
        debugPrint('[GoogleSignIn] ERROR: ID token is null');
        // This can happen if serverClientId is not properly configured
        return GoogleSignInResult.error(
          'Failed to get ID token. Please check Google Sign-In configuration.'
        );
      }

      debugPrint('[GoogleSignIn] Success! Email: ${account.email}');
      return GoogleSignInResult.success(
        idToken: auth.idToken!,
        accessToken: auth.accessToken,
        email: account.email,
        displayName: account.displayName,
        photoUrl: account.photoUrl,
      );
    } catch (e, stackTrace) {
      debugPrint('[GoogleSignIn] ERROR: $e');
      debugPrint('[GoogleSignIn] Stack trace: $stackTrace');
      
      String errorMessage = e.toString();
      
      // Provide more helpful error messages
      if (errorMessage.contains('ApiException: 10')) {
        errorMessage = 'Google Sign-In configuration error. Please check SHA-1 fingerprint in Google Cloud Console.';
      } else if (errorMessage.contains('ApiException: 12500')) {
        errorMessage = 'Google Sign-In failed. Please update Google Play Services.';
      } else if (errorMessage.contains('ApiException: 7')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (errorMessage.contains('DEVELOPER_ERROR')) {
        errorMessage = 'Google Sign-In configuration error. SHA-1 fingerprint may not be registered.';
      }
      
      return GoogleSignInResult.error(errorMessage);
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }

  /// Disconnect Google account (revokes access)
  Future<void> disconnect() async {
    await _googleSignIn.disconnect();
  }

  /// Check if user is currently signed in
  Future<bool> isSignedIn() async {
    return _googleSignIn.isSignedIn();
  }

  /// Get current signed-in account
  GoogleSignInAccount? get currentUser => _googleSignIn.currentUser;
}

/// Result class for Google Sign-In
class GoogleSignInResult {
  final bool isSuccess;
  final bool isCancelled;
  final String? error;
  final String? idToken;
  final String? accessToken;
  final String? email;
  final String? displayName;
  final String? photoUrl;

  GoogleSignInResult._({
    required this.isSuccess,
    required this.isCancelled,
    this.error,
    this.idToken,
    this.accessToken,
    this.email,
    this.displayName,
    this.photoUrl,
  });

  factory GoogleSignInResult.success({
    required String idToken,
    String? accessToken,
    String? email,
    String? displayName,
    String? photoUrl,
  }) {
    return GoogleSignInResult._(
      isSuccess: true,
      isCancelled: false,
      idToken: idToken,
      accessToken: accessToken,
      email: email,
      displayName: displayName,
      photoUrl: photoUrl,
    );
  }

  factory GoogleSignInResult.cancelled() {
    return GoogleSignInResult._(
      isSuccess: false,
      isCancelled: true,
    );
  }

  factory GoogleSignInResult.error(String message) {
    return GoogleSignInResult._(
      isSuccess: false,
      isCancelled: false,
      error: message,
    );
  }
}

/// Provider for GoogleSignInService
final googleSignInServiceProvider = Provider<GoogleSignInService>((ref) {
  return GoogleSignInService();
});