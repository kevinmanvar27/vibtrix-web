import 'package:equatable/equatable.dart';

/// Base failure class for all domain-level errors
abstract class Failure extends Equatable {
  final String message;
  final String? code;
  final dynamic originalError;

  const Failure({
    required this.message,
    this.code,
    this.originalError,
  });

  @override
  List<Object?> get props => [message, code];
}

/// Server/API related failures
class ServerFailure extends Failure {
  final int? statusCode;

  const ServerFailure({
    required super.message,
    super.code,
    super.originalError,
    this.statusCode,
  });

  factory ServerFailure.fromStatusCode(int statusCode, [String? message]) {
    switch (statusCode) {
      case 400:
        return ServerFailure(
          message: message ?? 'Bad request',
          code: 'BAD_REQUEST',
          statusCode: statusCode,
        );
      case 401:
        return ServerFailure(
          message: message ?? 'Unauthorized. Please login again.',
          code: 'UNAUTHORIZED',
          statusCode: statusCode,
        );
      case 403:
        return ServerFailure(
          message: message ?? 'You don\'t have permission to perform this action',
          code: 'FORBIDDEN',
          statusCode: statusCode,
        );
      case 404:
        return ServerFailure(
          message: message ?? 'Resource not found',
          code: 'NOT_FOUND',
          statusCode: statusCode,
        );
      case 409:
        return ServerFailure(
          message: message ?? 'Conflict with existing resource',
          code: 'CONFLICT',
          statusCode: statusCode,
        );
      case 422:
        return ServerFailure(
          message: message ?? 'Validation error',
          code: 'VALIDATION_ERROR',
          statusCode: statusCode,
        );
      case 429:
        return ServerFailure(
          message: message ?? 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
          statusCode: statusCode,
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerFailure(
          message: message ?? 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          statusCode: statusCode,
        );
      default:
        return ServerFailure(
          message: message ?? 'An unexpected error occurred',
          code: 'UNKNOWN',
          statusCode: statusCode,
        );
    }
  }

  @override
  List<Object?> get props => [message, code, statusCode];
}

/// Network connectivity failures
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection. Please check your network.',
    super.code = 'NO_NETWORK',
    super.originalError,
  });
}

/// Cache/local storage failures
class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Failed to access local storage',
    super.code = 'CACHE_ERROR',
    super.originalError,
  });
}

/// Authentication failures
class AuthFailure extends Failure {
  const AuthFailure({
    required super.message,
    super.code = 'AUTH_ERROR',
    super.originalError,
  });

  factory AuthFailure.invalidCredentials() => const AuthFailure(
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      );

  factory AuthFailure.sessionExpired() => const AuthFailure(
        message: 'Your session has expired. Please login again.',
        code: 'SESSION_EXPIRED',
      );

  factory AuthFailure.accountNotVerified() => const AuthFailure(
        message: 'Please verify your email to continue',
        code: 'NOT_VERIFIED',
      );

  factory AuthFailure.accountDisabled() => const AuthFailure(
        message: 'Your account has been disabled',
        code: 'ACCOUNT_DISABLED',
      );
}

/// Validation failures
class ValidationFailure extends Failure {
  final Map<String, List<String>>? fieldErrors;

  const ValidationFailure({
    required super.message,
    super.code = 'VALIDATION_ERROR',
    super.originalError,
    this.fieldErrors,
  });

  @override
  List<Object?> get props => [message, code, fieldErrors];
}

/// Permission failures
class PermissionFailure extends Failure {
  const PermissionFailure({
    required super.message,
    super.code = 'PERMISSION_DENIED',
    super.originalError,
  });
}

/// Timeout failures
class TimeoutFailure extends Failure {
  const TimeoutFailure({
    super.message = 'Request timed out. Please try again.',
    super.code = 'TIMEOUT',
    super.originalError,
  });
}

/// Cancellation (user cancelled operation)
class CancellationFailure extends Failure {
  const CancellationFailure({
    super.message = 'Operation was cancelled',
    super.code = 'CANCELLED',
    super.originalError,
  });
}

/// Unknown/unexpected failures
class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred',
    super.code = 'UNKNOWN',
    super.originalError,
  });
}
