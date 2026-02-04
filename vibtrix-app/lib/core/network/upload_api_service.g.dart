// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upload_api_service.dart';

// **************************************************************************
// RetrofitGenerator
// **************************************************************************

// ignore_for_file: unnecessary_brace_in_string_interps,no_leading_underscores_for_local_identifiers,unused_element,unnecessary_string_interpolations

class _UploadApiService implements UploadApiService {
  _UploadApiService(this._dio, {this.baseUrl, this.errorLogger});

  final Dio _dio;

  String? baseUrl;

  final ParseErrorLogger? errorLogger;

  @override
  Future<AvatarUploadResponse> uploadAvatar(
    List<int> fileBytes,
    String fileName,
  ) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = FormData();
    _data.files.add(MapEntry(
      'file',
      MultipartFile.fromBytes(
        fileBytes,
        filename: fileName,
        contentType: MediaType.parse(_getContentType(fileName)),
      ),
    ));
    final _options = _setStreamType<AvatarUploadResponse>(
      Options(method: 'POST', headers: _headers, extra: _extra, contentType: 'multipart/form-data')
          .compose(
            _dio.options,
            '/upload/avatar',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late AvatarUploadResponse _value;
    try {
      _value = AvatarUploadResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  /// Upload media file to /upload endpoint
  /// Backend expects form-data with 'files' field
  /// Returns: { files: [{ name, url, mediaId }] }
  Future<MediaUploadResponse> uploadMedia(
    List<int> fileBytes,
    String fileName, {
    bool isCompetitionEntry = false,
    String? competitionId,
  }) async {
    final _extra = <String, dynamic>{};
    final queryParameters = <String, dynamic>{};
    final _headers = <String, dynamic>{};
    final _data = FormData();
    
    // Backend expects 'files' as the field name
    _data.files.add(MapEntry(
      'files',
      MultipartFile.fromBytes(
        fileBytes,
        filename: fileName,
        contentType: MediaType.parse(_getContentType(fileName)),
      ),
    ));
    
    // Add optional competition fields
    if (isCompetitionEntry) {
      _data.fields.add(const MapEntry('isCompetitionEntry', 'true'));
    }
    if (competitionId != null) {
      _data.fields.add(MapEntry('competitionId', competitionId));
    }
    
    final _options = _setStreamType<MediaUploadResponse>(
      Options(method: 'POST', headers: _headers, extra: _extra, contentType: 'multipart/form-data')
          .compose(
            _dio.options,
            '/upload',
            queryParameters: queryParameters,
            data: _data,
          )
          .copyWith(baseUrl: _combineBaseUrls(_dio.options.baseUrl, baseUrl)),
    );
    final _result = await _dio.fetch<Map<String, dynamic>>(_options);
    late MediaUploadResponse _value;
    try {
      _value = MediaUploadResponse.fromJson(_result.data!);
    } on Object catch (e, s) {
      errorLogger?.logError(e, s, _options);
      rethrow;
    }
    return _value;
  }

  String _getContentType(String fileName) {
    final ext = fileName.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      default:
        return 'application/octet-stream';
    }
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

  String _combineBaseUrls(
    String dioBaseUrl,
    String? baseUrl,
  ) {
    if (baseUrl == null || baseUrl.isEmpty) {
      return dioBaseUrl;
    }

    final url = Uri.parse(baseUrl);

    if (url.isAbsolute) {
      return url.toString();
    }

    return Uri.parse(dioBaseUrl).resolveUri(url).toString();
  }
}
