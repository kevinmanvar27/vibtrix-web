import 'dart:io';

import 'package:dio/dio.dart';
import '../error/failures.dart';
import '../error/exceptions.dart';
import '../utils/either.dart';

/// Handles network errors and converts them to domain failures
class NetworkErrorHandler {
  /// Convert DioException to Failure
  static Failure handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutFailure();

      case DioExceptionType.badResponse:
        return _handleResponseError(error.response);

      case DioExceptionType.cancel:
        return const CancellationFailure();

      case DioExceptionType.connectionError:
        return const NetworkFailure();

      case DioExceptionType.badCertificate:
        return const ServerFailure(
          message: 'Certificate verification failed',
          code: 'CERTIFICATE_ERROR',
        );

      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return const NetworkFailure();
        }
        return UnknownFailure(
          message: error.message ?? 'An unexpected error occurred',
          originalError: error,
        );
    }
  }

  /// Handle HTTP response errors
  static Failure _handleResponseError(Response? response) {
    if (response == null) {
      return const ServerFailure(
        message: 'No response from server',
        code: 'NO_RESPONSE',
      );
    }

    final statusCode = response.statusCode ?? 500;
    String? message;

    // Try to extract error message from response body
    if (response.data is Map<String, dynamic>) {
      final data = response.data as Map<String, dynamic>;
      message = data['message'] as String? ??
          data['error'] as String? ??
          data['detail'] as String?;

      // Handle validation errors
      if (statusCode == 422 && data['errors'] != null) {
        final errors = data['errors'] as Map<String, dynamic>?;
        if (errors != null) {
          final fieldErrors = errors.map((key, value) {
            if (value is List) {
              return MapEntry(key, value.cast<String>());
            }
            return MapEntry(key, [value.toString()]);
          });
          return ValidationFailure(
            message: message ?? 'Validation error',
            fieldErrors: fieldErrors,
          );
        }
      }
    }

    return ServerFailure.fromStatusCode(statusCode, message);
  }

  /// Convert any exception to Failure
  static Failure handleException(dynamic error) {
    if (error is DioException) {
      return handleDioError(error);
    }

    if (error is SocketException) {
      return const NetworkFailure();
    }

    if (error is ServerException) {
      return ServerFailure(
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        originalError: error,
      );
    }

    if (error is CacheException) {
      return CacheFailure(
        message: error.message,
        originalError: error,
      );
    }

    if (error is AuthException) {
      return AuthFailure(
        message: error.message,
        code: error.code,
        originalError: error,
      );
    }

    if (error is ValidationException) {
      return ValidationFailure(
        message: error.message,
        fieldErrors: error.fieldErrors,
        originalError: error,
      );
    }

    if (error is AppException) {
      return UnknownFailure(
        message: error.message,
        code: error.code,
        originalError: error,
      );
    }

    return UnknownFailure(
      message: error.toString(),
      originalError: error,
    );
  }
}

/// Extension to run async operations with error handling
extension SafeApiCall<T> on Future<T> {
  /// Execute API call and return Either
  Future<Either<Failure, T>> toEither() async {
    try {
      final result = await this;
      return Right(result);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  /// Execute API call with transformation and return Result
  Future<Result<R>> safeApiCall<R>({
    required R Function(T response) transform,
  }) async {
    try {
      final result = await this;
      return Right(transform(result));
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
