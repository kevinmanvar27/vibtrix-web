/// Base exception class for all app exceptions
class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AppException({
    required this.message,
    this.code,
    this.originalError,
  });

  @override
  String toString() => '${runtimeType}: $message (code: $code)';
}

/// Server/API exceptions
class ServerException extends AppException {
  final int? statusCode;

  const ServerException({
    required super.message,
    super.code,
    super.originalError,
    this.statusCode,
  });
}

/// Network exceptions
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'No internet connection',
    super.code = 'NO_NETWORK',
    super.originalError,
  });
}

/// Cache exceptions
class CacheException extends AppException {
  const CacheException({
    super.message = 'Cache error',
    super.code = 'CACHE_ERROR',
    super.originalError,
  });
}

/// Authentication exceptions
class AuthException extends AppException {
  const AuthException({
    required super.message,
    super.code = 'AUTH_ERROR',
    super.originalError,
  });
}

/// Validation exceptions
class ValidationException extends AppException {
  final Map<String, List<String>>? fieldErrors;

  const ValidationException({
    required super.message,
    super.code = 'VALIDATION_ERROR',
    super.originalError,
    this.fieldErrors,
  });
}

/// Timeout exceptions
class AppTimeoutException extends AppException {
  const AppTimeoutException({
    super.message = 'Request timed out',
    super.code = 'TIMEOUT',
    super.originalError,
  });
}
