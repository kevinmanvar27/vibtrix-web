// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_api_service.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RecentSearchModel _$RecentSearchModelFromJson(Map<String, dynamic> json) =>
    RecentSearchModel(
      id: json['id'] as String,
      query: json['query'] as String,
      type: json['type'] as String,
      targetId: json['targetId'] as String?,
      targetName: json['targetName'] as String?,
      targetImage: json['targetImage'] as String?,
      searchedAt: DateTime.parse(json['searchedAt'] as String),
    );

Map<String, dynamic> _$RecentSearchModelToJson(RecentSearchModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'query': instance.query,
      'type': instance.type,
      'targetId': instance.targetId,
      'targetName': instance.targetName,
      'targetImage': instance.targetImage,
      'searchedAt': instance.searchedAt.toIso8601String(),
    };

SaveRecentSearchRequest _$SaveRecentSearchRequestFromJson(
  Map<String, dynamic> json,
) => SaveRecentSearchRequest(
  query: json['query'] as String,
  type: json['type'] as String,
  targetId: json['targetId'] as String?,
);

Map<String, dynamic> _$SaveRecentSearchRequestToJson(
  SaveRecentSearchRequest instance,
) => <String, dynamic>{
  'query': instance.query,
  'type': instance.type,
  'targetId': instance.targetId,
};

SearchSuggestionsModel _$SearchSuggestionsModelFromJson(
  Map<String, dynamic> json,
) => SearchSuggestionsModel(
  textSuggestions:
      (json['textSuggestions'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
  userSuggestions:
      (json['userSuggestions'] as List<dynamic>)
          .map((e) => SimpleUserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
  hashtagSuggestions:
      (json['hashtagSuggestions'] as List<dynamic>)
          .map((e) => HashtagModel.fromJson(e as Map<String, dynamic>))
          .toList(),
);

Map<String, dynamic> _$SearchSuggestionsModelToJson(
  SearchSuggestionsModel instance,
) => <String, dynamic>{
  'textSuggestions': instance.textSuggestions,
  'userSuggestions': instance.userSuggestions,
  'hashtagSuggestions': instance.hashtagSuggestions,
};

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations,unused_element_parameter

class _SearchApiService implements SearchApiService {
  _SearchApiService(this._dio, {this.baseUrl, this.errorLogger});

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<SearchResultModel> search({
    required String query,
    String? type,
    String? cursor,
    int limit = 20,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'q': query,
      r'type': type,
      r'cursor': cursor,
      r'limit': limit,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<SearchResultModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/search',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late SearchResultModel _value;
    try {
      _value = SearchResultModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PaginatedResponse<SimpleUserModel>> searchUsers({
    required String query,
    String? cursor,
    int limit = 20,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'q': query,
      r'cursor': cursor,
      r'limit': limit,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedResponse<SimpleUserModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/users/search',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedResponse<SimpleUserModel> _value;
    try {
      _value = PaginatedResponse<SimpleUserModel>.fromJson(
        _result.data!,
        (json) => SimpleUserModel.fromJson(json as Map<String, dynamic>),
      );
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  // NOTE: searchPosts and searchHashtags removed - endpoints do not exist

  @override
  Future<TrendingHashtagsModel> getTrendingHashtags({
    int limit = 10,
    String? period,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'limit': limit,
      r'period': period,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<TrendingHashtagsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/hashtags/trending',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late TrendingHashtagsModel _value;
    try {
      _value = TrendingHashtagsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PaginatedResponse<PostModel>> getPostsByHashtag(
    String hashtag, {
    String? cursor,
    int limit = 20,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'cursor': cursor,
      r'limit': limit,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PaginatedResponse<PostModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/hashtags/${hashtag}/posts',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedResponse<PostModel> _value;
    try {
      _value = PaginatedResponse<PostModel>.fromJson(
        _result.data!,
        (json) => PostModel.fromJson(json as Map<String, dynamic>),
      );
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  RequestOptions _setStreamType<T>(RequestOptions requestOptions) {
    if (T != dynamic &&
        !(requestOptions.responseType == ResponseType.bytes ||
            requestOptions.responseType == ResponseType.stream)) {
      if (T == String) {
        requestOptions.responseType = ResponseType.plain;
      } else {
        requestOptions.responseType = ResponseType.json;
      }
    }
    return requestOptions;
  }

  String _combineBaseUrls(String dioBaseUrl, String? baseUrl) {
    if (baseUrl == null || baseUrl.trim().isEmpty) {
      return dioBaseUrl;
    }

    final url = Uri.parse(baseUrl);

    if (url.isAbsolute) {
      return url.toString();
    }

    return Uri.parse(dioBaseUrl).resolveUri(url).toString();
  }
}
