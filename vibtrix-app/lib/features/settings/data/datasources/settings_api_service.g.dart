// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_api_service.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UpdateSettingsRequest _$UpdateSettingsRequestFromJson(
  Map<String, dynamic> json,
) => UpdateSettingsRequest(
  language: json['language'] as String?,
  theme: json['theme'] as String?,
  autoPlayVideos: json['autoPlayVideos'] as bool?,
  dataSaver: json['dataSaver'] as bool?,
  videoQuality: json['videoQuality'] as String?,
);

Map<String, dynamic> _$UpdateSettingsRequestToJson(
  UpdateSettingsRequest instance,
) => <String, dynamic>{
  'language': instance.language,
  'theme': instance.theme,
  'autoPlayVideos': instance.autoPlayVideos,
  'dataSaver': instance.dataSaver,
  'videoQuality': instance.videoQuality,
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
  marketingEmails: json['marketingEmails'] as bool?,
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
  'marketingEmails': instance.marketingEmails,
};

UpdatePrivacySettingsRequest _$UpdatePrivacySettingsRequestFromJson(
  Map<String, dynamic> json,
) => UpdatePrivacySettingsRequest(
  privateAccount: json['privateAccount'] as bool?,
  showOnlineStatus: json['showOnlineStatus'] as bool?,
  allowTagging: json['allowTagging'] as bool?,
  allowMentions: json['allowMentions'] as bool?,
  whoCanMessage: json['whoCanMessage'] as String?,
  whoCanComment: json['whoCanComment'] as String?,
);

Map<String, dynamic> _$UpdatePrivacySettingsRequestToJson(
  UpdatePrivacySettingsRequest instance,
) => <String, dynamic>{
  'privateAccount': instance.privateAccount,
  'showOnlineStatus': instance.showOnlineStatus,
  'allowTagging': instance.allowTagging,
  'allowMentions': instance.allowMentions,
  'whoCanMessage': instance.whoCanMessage,
  'whoCanComment': instance.whoCanComment,
};

DeactivateAccountRequest _$DeactivateAccountRequestFromJson(
  Map<String, dynamic> json,
) => DeactivateAccountRequest(
  password: json['password'] as String,
  reason: json['reason'] as String?,
);

Map<String, dynamic> _$DeactivateAccountRequestToJson(
  DeactivateAccountRequest instance,
) => <String, dynamic>{
  'password': instance.password,
  'reason': instance.reason,
};

DeleteAccountRequest _$DeleteAccountRequestFromJson(
  Map<String, dynamic> json,
) => DeleteAccountRequest(
  password: json['password'] as String,
  reason: json['reason'] as String?,
  confirmDeletion: json['confirmDeletion'] as bool,
);

Map<String, dynamic> _$DeleteAccountRequestToJson(
  DeleteAccountRequest instance,
) => <String, dynamic>{
  'password': instance.password,
  'reason': instance.reason,
  'confirmDeletion': instance.confirmDeletion,
};

DataExportResponse _$DataExportResponseFromJson(Map<String, dynamic> json) =>
    DataExportResponse(
      exportId: json['exportId'] as String,
      status: json['status'] as String,
      downloadUrl: json['downloadUrl'] as String?,
      expiresAt:
          json['expiresAt'] == null
              ? null
              : DateTime.parse(json['expiresAt'] as String),
      requestedAt: DateTime.parse(json['requestedAt'] as String),
    );

Map<String, dynamic> _$DataExportResponseToJson(DataExportResponse instance) =>
    <String, dynamic>{
      'exportId': instance.exportId,
      'status': instance.status,
      'downloadUrl': instance.downloadUrl,
      'expiresAt': instance.expiresAt?.toIso8601String(),
      'requestedAt': instance.requestedAt.toIso8601String(),
    };

SessionModel _$SessionModelFromJson(Map<String, dynamic> json) => SessionModel(
  id: json['id'] as String,
  deviceName: json['deviceName'] as String,
  deviceType: json['deviceType'] as String,
  location: json['location'] as String?,
  ipAddress: json['ipAddress'] as String?,
  isCurrent: json['isCurrent'] as bool,
  lastActiveAt: DateTime.parse(json['lastActiveAt'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$SessionModelToJson(SessionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'deviceName': instance.deviceName,
      'deviceType': instance.deviceType,
      'location': instance.location,
      'ipAddress': instance.ipAddress,
      'isCurrent': instance.isCurrent,
      'lastActiveAt': instance.lastActiveAt.toIso8601String(),
      'createdAt': instance.createdAt.toIso8601String(),
    };

LinkedAccountModel _$LinkedAccountModelFromJson(Map<String, dynamic> json) =>
    LinkedAccountModel(
      provider: json['provider'] as String,
      email: json['email'] as String?,
      name: json['name'] as String?,
      linkedAt: DateTime.parse(json['linkedAt'] as String),
    );

Map<String, dynamic> _$LinkedAccountModelToJson(LinkedAccountModel instance) =>
    <String, dynamic>{
      'provider': instance.provider,
      'email': instance.email,
      'name': instance.name,
      'linkedAt': instance.linkedAt.toIso8601String(),
    };

LinkAccountRequest _$LinkAccountRequestFromJson(Map<String, dynamic> json) =>
    LinkAccountRequest(
      provider: json['provider'] as String,
      token: json['token'] as String,
    );

Map<String, dynamic> _$LinkAccountRequestToJson(LinkAccountRequest instance) =>
    <String, dynamic>{'provider': instance.provider, 'token': instance.token};

StickerCategoryModel _$StickerCategoryModelFromJson(
  Map<String, dynamic> json,
) => StickerCategoryModel(
  id: json['id'] as String,
  name: json['name'] as String,
  icon: json['icon'] as String?,
  order: (json['order'] as num).toInt(),
);

Map<String, dynamic> _$StickerCategoryModelToJson(
  StickerCategoryModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'icon': instance.icon,
  'order': instance.order,
};

SetLanguageRequest _$SetLanguageRequestFromJson(Map<String, dynamic> json) =>
    SetLanguageRequest(languageCode: json['languageCode'] as String);

Map<String, dynamic> _$SetLanguageRequestToJson(SetLanguageRequest instance) =>
    <String, dynamic>{'languageCode': instance.languageCode};

TwoFactorCodeRequest _$TwoFactorCodeRequestFromJson(
  Map<String, dynamic> json,
) => TwoFactorCodeRequest(code: json['code'] as String);

Map<String, dynamic> _$TwoFactorCodeRequestToJson(
  TwoFactorCodeRequest instance,
) => <String, dynamic>{'code': instance.code};

TwoFactorStatusResponse _$TwoFactorStatusResponseFromJson(
  Map<String, dynamic> json,
) => TwoFactorStatusResponse(
  enabled: json['enabled'] as bool,
  method: json['method'] as String?,
);

Map<String, dynamic> _$TwoFactorStatusResponseToJson(
  TwoFactorStatusResponse instance,
) => <String, dynamic>{'enabled': instance.enabled, 'method': instance.method};

UpdateCheckResponse _$UpdateCheckResponseFromJson(Map<String, dynamic> json) =>
    UpdateCheckResponse(
      updateAvailable: json['updateAvailable'] as bool,
      latestVersion: json['latestVersion'] as String?,
      isMandatory: json['isMandatory'] as bool? ?? false,
    );

Map<String, dynamic> _$UpdateCheckResponseToJson(
  UpdateCheckResponse instance,
) => <String, dynamic>{
  'updateAvailable': instance.updateAvailable,
  'latestVersion': instance.latestVersion,
  'isMandatory': instance.isMandatory,
};

LegalDocumentResponse _$LegalDocumentResponseFromJson(
  Map<String, dynamic> json,
) => LegalDocumentResponse(
  content: json['content'] as String,
  lastUpdated: DateTime.parse(json['lastUpdated'] as String),
  version: json['version'] as String?,
);

Map<String, dynamic> _$LegalDocumentResponseToJson(
  LegalDocumentResponse instance,
) => <String, dynamic>{
  'content': instance.content,
  'lastUpdated': instance.lastUpdated.toIso8601String(),
  'version': instance.version,
};

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations,unused_element_parameter

class _SettingsApiService implements SettingsApiService {
  _SettingsApiService(this._dio, {this.baseUrl, this.errorLogger});

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<AppSettingsModel> getSettings() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<AppSettingsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AppSettingsModel _value;
    try {
      _value = AppSettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<AppSettingsModel> updateSettings(UpdateSettingsRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<AppSettingsModel>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AppSettingsModel _value;
    try {
      _value = AppSettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<NotificationSettingsModel> getNotificationSettings() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<NotificationSettingsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/notifications',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late NotificationSettingsModel _value;
    try {
      _value = NotificationSettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<NotificationSettingsModel> updateNotificationSettings(
    UpdateNotificationSettingsRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<NotificationSettingsModel>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/notifications',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late NotificationSettingsModel _value;
    try {
      _value = NotificationSettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PrivacySettingsModel> getPrivacySettings() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<PrivacySettingsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/privacy',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PrivacySettingsModel _value;
    try {
      _value = PrivacySettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<PrivacySettingsModel> updatePrivacySettings(
    UpdatePrivacySettingsRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<PrivacySettingsModel>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/privacy',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late PrivacySettingsModel _value;
    try {
      _value = PrivacySettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<AppConfigModel> getAppConfig() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<AppConfigModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/config',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AppConfigModel _value;
    try {
      _value = AppConfigModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<FeedStickerModel>> getStickers({
    String? category,
    bool? activeOnly,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{
      r'category': category,
      r'active': activeOnly,
    };
    queryParameters.removeWhere((k, v) => v == null);
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<FeedStickerModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/stickers',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<FeedStickerModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    FeedStickerModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<StickerCategoryModel>> getStickerCategories() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<StickerCategoryModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/stickers/categories',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<StickerCategoryModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    StickerCategoryModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> deactivateAccount(DeactivateAccountRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account/deactivate',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<void> deleteAccount(DeleteAccountRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account/delete',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<DataExportResponse> requestDataExport() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<DataExportResponse>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account/export',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late DataExportResponse _value;
    try {
      _value = DataExportResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<DataExportResponse> getDataExportStatus(String exportId) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<DataExportResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account/export/${exportId}',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late DataExportResponse _value;
    try {
      _value = DataExportResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<SessionModel>> getActiveSessions() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<SessionModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/sessions',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<SessionModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) => SessionModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> revokeSession(String sessionId) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'DELETE', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/sessions/${sessionId}',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<void> revokeAllSessions() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'DELETE', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/sessions',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<List<LinkedAccountModel>> getLinkedAccounts() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<LinkedAccountModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/linked-accounts',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<LinkedAccountModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    LinkedAccountModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<LinkedAccountModel> linkAccount(LinkAccountRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<LinkedAccountModel>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/linked-accounts',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late LinkedAccountModel _value;
    try {
      _value = LinkedAccountModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> unlinkAccount(String provider) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'DELETE', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/linked-accounts/${provider}',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<AccountSettingsModel> getAccountSettings() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<AccountSettingsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AccountSettingsModel _value;
    try {
      _value = AccountSettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> updateAccountSettings(
    UpdateAccountSettingsRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/account',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<SecuritySettingsModel> getSecuritySettings() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<SecuritySettingsModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/security',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late SecuritySettingsModel _value;
    try {
      _value = SecuritySettingsModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> updateSecuritySettings(
    UpdateSecuritySettingsRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/security',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<ContentPreferencesModel> getContentPreferences() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<ContentPreferencesModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/content-preferences',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late ContentPreferencesModel _value;
    try {
      _value = ContentPreferencesModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> updateContentPreferences(
    UpdateContentPreferencesRequest request,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/content-preferences',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<List<LanguageModel>> getAvailableLanguages() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<LanguageModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/languages',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<LanguageModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    LanguageModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> setLanguage(SetLanguageRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'PUT', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/language',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<DataUsageModel> getDataUsage() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<DataUsageModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/data-usage',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late DataUsageModel _value;
    try {
      _value = DataUsageModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> clearCache() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'DELETE', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/cache',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<void> clearDownloads() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<void>(
      Options(method: 'DELETE', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/downloads',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<StorageInfoModel> getStorageInfo() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<StorageInfoModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/storage',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late StorageInfoModel _value;
    try {
      _value = StorageInfoModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<TwoFactorSetupModel> setupTwoFactor() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<TwoFactorSetupModel>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/2fa/setup',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late TwoFactorSetupModel _value;
    try {
      _value = TwoFactorSetupModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<void> enableTwoFactor(TwoFactorCodeRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/2fa/enable',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<void> disableTwoFactor(TwoFactorCodeRequest request) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = <String, dynamic>{};
    _data.addAll(request.toJson());
    final _options = _setStreamType<void>(
      Options(method: 'POST', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/2fa/disable',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    await _dio.fetch<void>(_options);
  }

  @override
  Future<TwoFactorStatusResponse> getTwoFactorStatus() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<TwoFactorStatusResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/settings/2fa/status',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late TwoFactorStatusResponse _value;
    try {
      _value = TwoFactorStatusResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<AppVersionModel> getLatestVersion() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<AppVersionModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/app/version',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AppVersionModel _value;
    try {
      _value = AppVersionModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<UpdateCheckResponse> checkForUpdates() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<UpdateCheckResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/app/check-update',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late UpdateCheckResponse _value;
    try {
      _value = UpdateCheckResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<FaqModel>> getFaqs() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<FaqModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/help/faqs',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<FaqModel> _value;
    try {
      _value =
          _result.data!
              .map((dynamic i) => FaqModel.fromJson(i as Map<String, dynamic>))
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<List<FaqCategoryModel>> getFaqCategories() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<List<FaqCategoryModel>>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/help/faq-categories',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<List<dynamic>>(_options);
    late List<FaqCategoryModel> _value;
    try {
      _value =
          _result.data!
              .map(
                (dynamic i) =>
                    FaqCategoryModel.fromJson(i as Map<String, dynamic>),
              )
              .toList();
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<ContactInfoModel> getContactInfo() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<ContactInfoModel>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/help/contact',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late ContactInfoModel _value;
    try {
      _value = ContactInfoModel.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<LegalDocumentResponse> getTermsOfService() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<LegalDocumentResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/legal/terms',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late LegalDocumentResponse _value;
    try {
      _value = LegalDocumentResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<LegalDocumentResponse> getPrivacyPolicy() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<LegalDocumentResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/legal/privacy',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late LegalDocumentResponse _value;
    try {
      _value = LegalDocumentResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  @override
  Future<LegalDocumentResponse> getCommunityGuidelines() async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    const Map<String, dynamic>? _data = null;
    final _options = _setStreamType<LegalDocumentResponse>(
      Options(method: 'GET', headers: _headers, extra: _extra)
          .compose(
            _dio.options,
            '/legal/guidelines',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late LegalDocumentResponse _value;
    try {
      _value = LegalDocumentResponse.fromJson(_result.data!);
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
