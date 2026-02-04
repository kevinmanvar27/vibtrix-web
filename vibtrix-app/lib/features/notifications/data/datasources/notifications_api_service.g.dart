// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notifications_api_service.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UpdateDeviceRequest _$UpdateDeviceRequestFromJson(Map<String, dynamic> json) =>
    UpdateDeviceRequest(
      token: json['token'] as String?,
      enabled: json['enabled'] as bool?,
    );

Map<String, dynamic> _$UpdateDeviceRequestToJson(
  UpdateDeviceRequest instance,
) => <String, dynamic>{'token': instance.token, 'enabled': instance.enabled};

NotificationSettingsResponse _$NotificationSettingsResponseFromJson(
  Map<String, dynamic> json,
) => NotificationSettingsResponse(
  pushEnabled: json['pushEnabled'] as bool,
  emailEnabled: json['emailEnabled'] as bool,
  likesEnabled: json['likesEnabled'] as bool,
  commentsEnabled: json['commentsEnabled'] as bool,
  followsEnabled: json['followsEnabled'] as bool,
  mentionsEnabled: json['mentionsEnabled'] as bool,
  competitionUpdates: json['competitionUpdates'] as bool,
  chatMessages: json['chatMessages'] as bool,
);

Map<String, dynamic> _$NotificationSettingsResponseToJson(
  NotificationSettingsResponse instance,
) => <String, dynamic>{
  'pushEnabled': instance.pushEnabled,
  'emailEnabled': instance.emailEnabled,
  'likesEnabled': instance.likesEnabled,
  'commentsEnabled': instance.commentsEnabled,
  'followsEnabled': instance.followsEnabled,
  'mentionsEnabled': instance.mentionsEnabled,
  'competitionUpdates': instance.competitionUpdates,
  'chatMessages': instance.chatMessages,
};

UpdateNotificationSettingsRequest _$UpdateNotificationSettingsRequestFromJson(
  Map<String, dynamic> json,
) => UpdateNotificationSettingsRequest(
  pushEnabled: json['pushEnabled'] as bool?,
  emailEnabled: json['emailEnabled'] as bool?,
  likesEnabled: json['likesEnabled'] as bool?,
  commentsEnabled: json['commentsEnabled'] as bool?,
  followsEnabled: json['followsEnabled'] as bool?,
  mentionsEnabled: json['mentionsEnabled'] as bool?,
  competitionUpdates: json['competitionUpdates'] as bool?,
  chatMessages: json['chatMessages'] as bool?,
);

Map<String, dynamic> _$UpdateNotificationSettingsRequestToJson(
  UpdateNotificationSettingsRequest instance,
) => <String, dynamic>{
  'pushEnabled': instance.pushEnabled,
  'emailEnabled': instance.emailEnabled,
  'likesEnabled': instance.likesEnabled,
  'commentsEnabled': instance.commentsEnabled,
  'followsEnabled': instance.followsEnabled,
  'mentionsEnabled': instance.mentionsEnabled,
  'competitionUpdates': instance.competitionUpdates,
  'chatMessages': instance.chatMessages,
};

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations,unused_element_parameter

class _NotificationsApiService implements NotificationsApiService {
  _NotificationsApiService(this._dio, {this.baseUrl, this.errorLogger});

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<PaginatedResponse<NotificationModel>> getNotifications({
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
    final _options = _setStreamType<PaginatedResponse<NotificationModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/notifications',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PaginatedResponse<NotificationModel> _value;
    try {
      _value = PaginatedResponse<NotificationModel>.fromJson(
        _result.data!,
        (json) => NotificationModel.fromJson(json as Map<String, dynamic>),
      );
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<UnreadCountModel> getUnreadCount() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<UnreadCountModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/notifications/unread-count',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late UnreadCountModel _value;
    try {
      _value = UnreadCountModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> markAsRead(String notificationId) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/notifications/${notificationId}/read',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<void> markAllAsRead() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'PATCH', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/notifications/mark-as-read',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  // NOTE: deleteNotification, clearAllNotifications, registerDevice, unregisterDevice,
  // updateDevice, getNotificationSettings, updateNotificationSettings removed - endpoints do not exist

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
