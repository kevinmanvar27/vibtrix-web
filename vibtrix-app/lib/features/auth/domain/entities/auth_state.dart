import 'package:equatable/equatable.dart';

import 'package:equatable/equatable.dart';

import 'user.dart';

/// Authentication state for the application
/// 
/// Represents the current authentication status:
/// - initial: App just started, checking auth
/// - loading: Auth operation in progress
/// - authenticated: User is logged in
/// - unauthenticated: User is not logged in
/// - error: An error occurred during auth
class AuthState extends Equatable {
  final AuthStatus status;
  final User? user;
  final String? errorMessage;
  
  const AuthState._({
    required this.status,
    this.user,
    this.errorMessage,
  });
  
  /// Initial state when app starts
  const AuthState.initial() : this._(status: AuthStatus.initial);
  
  /// Loading state during auth operations
  const AuthState.loading() : this._(status: AuthStatus.loading);
  
  /// Authenticated state with user data
  const AuthState.authenticated({required User user}) 
      : this._(status: AuthStatus.authenticated, user: user);
  
  /// Unauthenticated state
  const AuthState.unauthenticated() 
      : this._(status: AuthStatus.unauthenticated);
  
  /// Error state with message
  const AuthState.error(String message) 
      : this._(status: AuthStatus.error, errorMessage: message);
  
  /// Check if user is authenticated
  bool get isAuthenticated => status == AuthStatus.authenticated;
  
  /// Check if auth is loading
  bool get isLoading => status == AuthStatus.loading || status == AuthStatus.initial;
  
  /// Check if there's an error
  bool get hasError => status == AuthStatus.error;
  
  /// Copy with new values
  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? errorMessage,
  }) {
    return AuthState._(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
  
  @override
  List<Object?> get props => [status, user, errorMessage];
}

/// Authentication status enum
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}
