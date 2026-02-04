/// DIO HTTP client configuration with interceptors
/// Handles authentication, logging, and error handling

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:vibtrix/core/constants/api_constants.dart';
import 'package:vibtrix/core/error/exceptions.dart';
import 'package:vibtrix/core/storage/secure_storage.dart';

class DioClient {
  late final Dio _dio;
  final SecureStorageService _secureStorage;
  bool _isRefreshing = false;

  DioClient({required SecureStorageService secureStorage})
      : _secureStorage = secureStorage {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.apiUrl,  // Use apiUrl which includes /api prefix
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        sendTimeout: ApiConstants.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  Dio get dio => _dio;

  void _setupInterceptors() {
    // Custom API Logger - Always show API calls in console
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final fullUrl = '${options.baseUrl}${options.path}';
          debugPrint('');
          debugPrint('╔══════════════════════════════════════════════════════════════');
          debugPrint('║ 🚀 API REQUEST');
          debugPrint('║ ${options.method} $fullUrl');
          if (options.queryParameters.isNotEmpty) {
            debugPrint('║ Query: ${options.queryParameters}');
          }
          if (options.data != null) {
            debugPrint('║ Body: ${options.data}');
          }
          debugPrint('╚══════════════════════════════════════════════════════════════');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          final fullUrl = '${response.requestOptions.baseUrl}${response.requestOptions.path}';
          debugPrint('');
          debugPrint('╔══════════════════════════════════════════════════════════════');
          debugPrint('║ ✅ API RESPONSE [${response.statusCode}]');
          debugPrint('║ ${response.requestOptions.method} $fullUrl');
          if (response.data != null) {
            final dataStr = response.data.toString();
            if (dataStr.length > 500) {
              debugPrint('║ Data: ${dataStr.substring(0, 500)}...');
            } else {
              debugPrint('║ Data: $dataStr');
            }
          }
          debugPrint('╚══════════════════════════════════════════════════════════════');
          return handler.next(response);
        },
        onError: (error, handler) {
          final fullUrl = '${error.requestOptions.baseUrl}${error.requestOptions.path}';
          debugPrint('');
          debugPrint('╔══════════════════════════════════════════════════════════════');
          debugPrint('║ ❌ API ERROR [${error.response?.statusCode ?? 'NO STATUS'}]');
          debugPrint('║ ${error.requestOptions.method} $fullUrl');
          debugPrint('║ Type: ${error.type}');
          debugPrint('║ Message: ${error.message}');
          if (error.response?.data != null) {
            debugPrint('║ Response: ${error.response?.data}');
          }
          debugPrint('╚══════════════════════════════════════════════════════════════');
          return handler.next(error);
        },
      ),
    );

    // Auth interceptor - adds JWT token to requests
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Skip auth for public endpoints
          if (_isPublicEndpoint(options.path)) {
            debugPrint('║ 🔓 Public endpoint - skipping auth');
            return handler.next(options);
          }

          final accessToken = await _secureStorage.getAccessToken();
          if (accessToken != null) {
            options.headers['Authorization'] = 'Bearer $accessToken';
            debugPrint('║ 🔐 Auth token added');
          } else {
            debugPrint('║ ⚠️ No auth token available');
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 - try to refresh token
          if (error.response?.statusCode == 401 && !_isRefreshing) {
            debugPrint('║ 🔄 Token expired - attempting refresh...');
            _isRefreshing = true;
            try {
              final refreshed = await _refreshToken();
              if (refreshed) {
                debugPrint('║ ✅ Token refreshed successfully');
                // Retry the original request
                final retryResponse = await _retryRequest(error.requestOptions);
                _isRefreshing = false;
                return handler.resolve(retryResponse);
              }
            } catch (e) {
              debugPrint('║ ❌ Token refresh failed: $e');
              // Refresh failed - clear tokens and propagate error
              _isRefreshing = false;
              await _secureStorage.clearTokens();
            }
            _isRefreshing = false;
          }
          return handler.next(error);
        },
      ),
    );

    // Error handling interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          final exception = _handleError(error);
          return handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              error: exception,
              response: error.response,
              type: error.type,
            ),
          );
        },
      ),
    );
  }

  bool _isPublicEndpoint(String path) {
    final publicEndpoints = [
      ApiConstants.login,
      ApiConstants.signup,
      ApiConstants.refreshToken,
      '/auth/forgot-password',
      '/auth/verify-email',
      '/auth/resend-verification',
      '/api/auth/google/mobile',
      '/api/auth/apple',
    ];
    return publicEndpoints.any((endpoint) => path.contains(endpoint));
  }

  Future<bool> _refreshToken() async {
    final refreshToken = await _secureStorage.getRefreshToken();
    if (refreshToken == null) return false;

    try {
      // Create a new Dio instance to avoid interceptor loop
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: ApiConstants.baseUrl,
          headers: {'Content-Type': 'application/json'},
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 10),
        ),
      );

      final response = await refreshDio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final newAccessToken = response.data['data']['accessToken'];
        final newRefreshToken = response.data['data']['refreshToken'];

        await _secureStorage.saveTokens(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        );
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<Response> _retryRequest(RequestOptions requestOptions) async {
    final accessToken = await _secureStorage.getAccessToken();
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $accessToken',
      },
    );

    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  Exception _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const AppTimeoutException(
          message: 'Connection timeout. Please check your internet connection.',
        );

      case DioExceptionType.connectionError:
        return const NetworkException(
          message: 'No internet connection. Please check your network.',
        );

      case DioExceptionType.badResponse:
        return _handleResponseError(error.response);

      case DioExceptionType.cancel:
        return const NetworkException(message: 'Request was cancelled.');

      default:
        return ServerException(
          message: error.message ?? 'An unexpected error occurred',
          statusCode: error.response?.statusCode,
        );
    }
  }

  Exception _handleResponseError(Response? response) {
    if (response == null) {
      return const ServerException(message: 'No response from server');
    }

    final statusCode = response.statusCode;
    final data = response.data;
    final message = data is Map
        ? (data['message'] ?? data['error'] ?? 'Unknown error')
        : 'Unknown error';

    switch (statusCode) {
      case 400:
        return ValidationException(
          message: message,
        );

      case 401:
        return AuthException(message: message);

      case 403:
        return ServerException(
          message: 'Access denied',
          statusCode: statusCode,
        );

      case 404:
        return ServerException(
          message: 'Resource not found',
          statusCode: statusCode,
        );

      case 422:
        return ValidationException(
          message: message,
        );

      case 429:
        return ServerException(
          message: 'Too many requests. Please try again later.',
          statusCode: statusCode,
        );

      case 500:
      case 502:
      case 503:
        return ServerException(
          message: 'Server error. Please try again later.',
          statusCode: statusCode,
        );

      default:
        return ServerException(
          message: message,
          statusCode: statusCode,
        );
    }
  }

  // Convenience methods for HTTP requests
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  // Multipart upload for media files
  Future<Response<T>> uploadFile<T>(
    String path, {
    required String filePath,
    required String fieldName,
    Map<String, dynamic>? additionalData,
    void Function(int, int)? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      if (additionalData != null) ...additionalData,
    });

    return _dio.post<T>(
      path,
      data: formData,
      onSendProgress: onSendProgress,
      cancelToken: cancelToken,
      options: Options(
        headers: {'Content-Type': 'multipart/form-data'},
      ),
    );
  }

  // Multiple files upload
  Future<Response<T>> uploadFiles<T>(
    String path, {
    required List<String> filePaths,
    required String fieldName,
    Map<String, dynamic>? additionalData,
    void Function(int, int)? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    final files = await Future.wait(
      filePaths.map((path) => MultipartFile.fromFile(path)),
    );

    final formData = FormData.fromMap({
      fieldName: files,
      if (additionalData != null) ...additionalData,
    });

    return _dio.post<T>(
      path,
      data: formData,
      onSendProgress: onSendProgress,
      cancelToken: cancelToken,
      options: Options(
        headers: {'Content-Type': 'multipart/form-data'},
      ),
    );
  }
}
