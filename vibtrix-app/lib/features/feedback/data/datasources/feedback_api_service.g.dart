// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'feedback_api_service.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AddFeedbackReplyRequest _$AddFeedbackReplyRequestFromJson(
  Map<String, dynamic> json,
) => AddFeedbackReplyRequest(message: json['message'] as String);

Map<String, dynamic> _$AddFeedbackReplyRequestToJson(
  AddFeedbackReplyRequest instance,
) => <String, dynamic>{'message': instance.message};

SubmitAppRatingRequest _$SubmitAppRatingRequestFromJson(
  Map<String, dynamic> json,
) => SubmitAppRatingRequest(
  rating: (json['rating'] as num).toInt(),
  review: json['review'] as String?,
);

Map<String, dynamic> _$SubmitAppRatingRequestToJson(
  SubmitAppRatingRequest instance,
) => <String, dynamic>{'rating': instance.rating, 'review': instance.review};

FeedbackReplyModel _$FeedbackReplyModelFromJson(Map<String, dynamic> json) =>
    FeedbackReplyModel(
      id: json['id'] as String,
      feedbackId: json['feedbackId'] as String,
      message: json['message'] as String,
      isFromSupport: json['isFromSupport'] as bool,
      supportAgentName: json['supportAgentName'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$FeedbackReplyModelToJson(FeedbackReplyModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'feedbackId': instance.feedbackId,
      'message': instance.message,
      'isFromSupport': instance.isFromSupport,
      'supportAgentName': instance.supportAgentName,
      'createdAt': instance.createdAt.toIso8601String(),
    };

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations,unused_element_parameter

class _FeedbackApiService implements FeedbackApiService {
  _FeedbackApiService(this._dio, {this.baseUrl, this.errorLogger});

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<FeedbackModel> submitFeedback(CreateFeedbackRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<FeedbackModel>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late FeedbackModel _value;
    try {
      _value = FeedbackModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<FeedbackModel> submitFeedbackWithAttachments(
    String type,
    String subject,
    String message,
    String? email,
    List<List<int>> attachments,
    List<String> attachmentNames,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    final _data = FormData();
    _data.fields.add(MapEntry('type', type));
    _data.fields.add(MapEntry('subject', subject));
    _data.fields.add(MapEntry('message', message));
    if (email != null) {
      _data.fields.add(MapEntry('email', email));
    }
    _data.files.addAll(
      attachments.map(
        (i) =>
            MapEntry('attachments', MultipartFile.fromBytes(i, filename: null)),
      ),
    );
    attachmentNames.forEach((i) {
      _data.fields.add(MapEntry('attachmentNames', i));
    });
    final _options = _setStreamType<FeedbackModel>(
      Options(
            method: 'POST',
            headers: _headers,
            extra: _extra,
            contentType: 'multipart/form-data',
          )
          .compose(
            _dio.options,
            '/feedback/with-attachments',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late FeedbackModel _value;
    try {
      _value = FeedbackModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<FeedbackCategoryModel>> getFeedbackCategories() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<FeedbackCategoryModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback/categories',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<FeedbackCategoryModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    FeedbackCategoryModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<FeedbackModel>> getMyFeedback({
    String? status,
    String? type,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{r'status': status, r'type': type};
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<FeedbackModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<FeedbackModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    FeedbackModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<FeedbackModel> getFeedback(String feedbackId) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<FeedbackModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback/${feedbackId}',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late FeedbackModel _value;
    try {
      _value = FeedbackModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<FeedbackReplyModel> addReply(
    String feedbackId,
    AddFeedbackReplyRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<FeedbackReplyModel>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback/${feedbackId}/reply',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late FeedbackReplyModel _value;
    try {
      _value = FeedbackReplyModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> submitAppRating(SubmitAppRatingRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/feedback/app-rating',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
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
