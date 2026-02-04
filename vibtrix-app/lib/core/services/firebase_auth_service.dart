import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../constants/auth_constants.dart';

/// Service for handling Firebase Authentication
/// 
/// Supports:
/// - Google Sign-In via Firebase Auth
/// - Returns Firebase idToken for backend verification
class FirebaseAuthService {
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  late final GoogleSignIn _googleSignIn;

  FirebaseAuthService() {
    // Configure Google Sign-In
    _googleSignIn = GoogleSignIn(
      scopes: AuthConstants.googleScopes,
    );
  }

  /// Get current Firebase user
  User? get currentUser => _firebaseAuth.currentUser;

  /// Stream of auth state changes
  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  /// Sign in with Google using Firebase Auth
  /// Returns Firebase idToken for backend API verification
  Future<FirebaseAuthResult> signInWithGoogle() async {
    try {
      // Check if Firebase is initialized
      if (Firebase.apps.isEmpty) {
        debugPrint('[FirebaseAuth] Firebase not initialized!');
        return FirebaseAuthResult.error(
          'Firebase is not configured. Please contact support.'
        );
      }
      
      debugPrint('[FirebaseAuth] Starting Google Sign-In...');
      
      // Sign out first to ensure fresh login
      await _googleSignIn.signOut();
      
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        debugPrint('[FirebaseAuth] User cancelled Google Sign-In');
        return FirebaseAuthResult.cancelled();
      }

      debugPrint('[FirebaseAuth] Google account selected: ${googleUser.email}');
      
      // Get Google auth credentials
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      debugPrint('[FirebaseAuth] Got Google auth - idToken: ${googleAuth.idToken != null}, accessToken: ${googleAuth.accessToken != null}');
      
      // Create Firebase credential
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Sign in to Firebase with Google credential
      debugPrint('[FirebaseAuth] Signing in to Firebase...');
      final UserCredential userCredential = await _firebaseAuth.signInWithCredential(credential);
      
      final User? user = userCredential.user;
      if (user == null) {
        debugPrint('[FirebaseAuth] Firebase sign-in failed - no user');
        return FirebaseAuthResult.error('Firebase sign-in failed');
      }

      debugPrint('[FirebaseAuth] Firebase sign-in successful: ${user.email}');
      
      // Get Firebase ID token for backend verification
      final String? firebaseIdToken = await user.getIdToken();
      
      if (firebaseIdToken == null) {
        debugPrint('[FirebaseAuth] Failed to get Firebase ID token');
        return FirebaseAuthResult.error('Failed to get authentication token');
      }

      debugPrint('[FirebaseAuth] Got Firebase ID token (length: ${firebaseIdToken.length})');
      
      return FirebaseAuthResult.success(
        idToken: firebaseIdToken,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoURL,
        uid: user.uid,
      );
    } on FirebaseAuthException catch (e) {
      debugPrint('[FirebaseAuth] FirebaseAuthException: ${e.code} - ${e.message}');
      return FirebaseAuthResult.error(_getFirebaseErrorMessage(e.code));
    } catch (e, stackTrace) {
      debugPrint('[FirebaseAuth] Error: $e');
      debugPrint('[FirebaseAuth] Stack trace: $stackTrace');
      return FirebaseAuthResult.error(_getGenericErrorMessage(e.toString()));
    }
  }

  /// Sign out from Firebase and Google
  Future<void> signOut() async {
    try {
      await Future.wait([
        _firebaseAuth.signOut(),
        _googleSignIn.signOut(),
      ]);
      debugPrint('[FirebaseAuth] Signed out successfully');
    } catch (e) {
      debugPrint('[FirebaseAuth] Sign out error: $e');
    }
  }

  /// Get fresh Firebase ID token (for token refresh)
  Future<String?> getIdToken({bool forceRefresh = false}) async {
    try {
      return await _firebaseAuth.currentUser?.getIdToken(forceRefresh);
    } catch (e) {
      debugPrint('[FirebaseAuth] Error getting ID token: $e');
      return null;
    }
  }

  /// Convert Firebase error codes to user-friendly messages
  String _getFirebaseErrorMessage(String code) {
    switch (code) {
      case 'account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      case 'invalid-credential':
        return 'Invalid credentials. Please try again.';
      case 'operation-not-allowed':
        return 'Google sign-in is not enabled. Please contact support.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'user-not-found':
        return 'No account found with this email.';
      case 'network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  /// Convert generic errors to user-friendly messages
  String _getGenericErrorMessage(String error) {
    if (error.contains('ApiException: 10') || error.contains('DEVELOPER_ERROR')) {
      return 'Google Sign-In configuration error. Please contact support.';
    } else if (error.contains('ApiException: 12500')) {
      return 'Please update Google Play Services and try again.';
    } else if (error.contains('ApiException: 7') || error.contains('network')) {
      return 'Network error. Please check your internet connection.';
    }
    return 'Sign-in failed. Please try again.';
  }
}

/// Result class for Firebase Auth operations
class FirebaseAuthResult {
  final bool isSuccess;
  final bool isCancelled;
  final String? error;
  final String? idToken;
  final String? email;
  final String? displayName;
  final String? photoUrl;
  final String? uid;

  FirebaseAuthResult._({
    required this.isSuccess,
    required this.isCancelled,
    this.error,
    this.idToken,
    this.email,
    this.displayName,
    this.photoUrl,
    this.uid,
  });

  factory FirebaseAuthResult.success({
    required String idToken,
    String? email,
    String? displayName,
    String? photoUrl,
    String? uid,
  }) {
    return FirebaseAuthResult._(
      isSuccess: true,
      isCancelled: false,
      idToken: idToken,
      email: email,
      displayName: displayName,
      photoUrl: photoUrl,
      uid: uid,
    );
  }

  factory FirebaseAuthResult.cancelled() {
    return FirebaseAuthResult._(
      isSuccess: false,
      isCancelled: true,
    );
  }

  factory FirebaseAuthResult.error(String message) {
    return FirebaseAuthResult._(
      isSuccess: false,
      isCancelled: false,
      error: message,
    );
  }
}

/// Provider for FirebaseAuthService
final firebaseAuthServiceProvider = Provider<FirebaseAuthService>((ref) {
  return FirebaseAuthService();
});
