import 'package:json_annotation/json_annotation.dart';

part 'base_response.g.dart';

/// Generic API response wrapper
@JsonSerializable(genericArgumentFactories: true)
class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final ApiError? error;

  const ApiResponse({
    required this.success,
    this.message,
    this.data,
    this.error,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$ApiResponseFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object? Function(T value) toJsonT) =>
      _$ApiResponseToJson(this, toJsonT);
}

@JsonSerializable()
class ApiError {
  final String code;
  final String message;
  final Map<String, dynamic>? details;

  const ApiError({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) =>
      _$ApiErrorFromJson(json);

  Map<String, dynamic> toJson() => _$ApiErrorToJson(this);
}

/// Paginated response for cursor-based pagination
/// Handles both standard format (items) and API format (posts)
@JsonSerializable(genericArgumentFactories: true)
class PaginatedResponse<T> {
  final List<T> items;
  final String? nextCursor;
  final bool hasMore;
  final int? totalCount;

  const PaginatedResponse({
    required this.items,
    this.nextCursor,
    required this.hasMore,
    this.totalCount,
  });

  /// Alias for [items] for backward compatibility
  List<T> get data => items;

  /// Custom fromJson that handles both 'items' and 'posts' keys
  /// API returns: { posts: [...], nextCursor: string | null }
  /// App expects: { items: [...], nextCursor: string, hasMore: boolean }
  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) {
    // Handle 'items', 'posts', 'comments', 'users', 'followers', 'chats', 'messages', and 'data' keys
    List<dynamic>? rawItems;
    if (json['items'] != null) {
      rawItems = json['items'] as List<dynamic>;
    } else if (json['posts'] != null) {
      rawItems = json['posts'] as List<dynamic>;
    } else if (json['comments'] != null) {
      rawItems = json['comments'] as List<dynamic>;
    } else if (json['users'] != null) {
      rawItems = json['users'] as List<dynamic>;
    } else if (json['followers'] != null) {
      rawItems = json['followers'] as List<dynamic>;
    } else if (json['following'] != null) {
      rawItems = json['following'] as List<dynamic>;
    } else if (json['chats'] != null) {
      rawItems = json['chats'] as List<dynamic>;
    } else if (json['messages'] != null) {
      rawItems = json['messages'] as List<dynamic>;
    } else if (json['notifications'] != null) {
      rawItems = json['notifications'] as List<dynamic>;
    } else if (json['data'] != null && json['data'] is List) {
      rawItems = json['data'] as List<dynamic>;
    }
    
    final items = rawItems?.map(fromJsonT).toList() ?? <T>[];
    
    // Handle nextCursor - can be string or int (nextPage), also handle previousCursor for messages
    String? nextCursor;
    if (json['nextCursor'] != null) {
      nextCursor = json['nextCursor'].toString();
    } else if (json['previousCursor'] != null) {
      // Messages API uses previousCursor for pagination
      nextCursor = json['previousCursor'].toString();
    } else if (json['nextPage'] != null) {
      nextCursor = json['nextPage'].toString();
    }
    
    // Handle hasMore: if not provided, derive from nextCursor
    bool hasMore;
    if (json['hasMore'] != null) {
      hasMore = json['hasMore'] as bool;
    } else {
      // If nextCursor exists, there are more items
      hasMore = nextCursor != null;
    }
    
    return PaginatedResponse<T>(
      items: items,
      nextCursor: nextCursor,
      hasMore: hasMore,
      totalCount: (json['totalCount'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson(Object? Function(T value) toJsonT) =>
      _$PaginatedResponseToJson(this, toJsonT);
}
