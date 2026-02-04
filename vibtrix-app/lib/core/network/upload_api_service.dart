import 'dart:io';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:http_parser/http_parser.dart';

part 'upload_api_service.g.dart';

/// Upload API Service for file uploads
/// Handles avatar and media uploads
@RestApi()
abstract class UploadApiService {
  factory UploadApiService(Dio dio, {String baseUrl}) = _UploadApiService;

  /// POST /upload/avatar - Upload avatar image
  /// Returns: { avatarUrl: string }
  @POST('/upload/avatar')
  @MultiPart()
  Future<AvatarUploadResponse> uploadAvatar(
    @Part(name: 'file') List<int> fileBytes,
    @Part(name: 'filename') String fileName,
  );

  // Note: For media upload, we use a custom method in the repository
  // because the backend expects multipart form-data with 'files' field
  // and returns { files: [{ name, url, mediaId }] }
}

/// Response from avatar upload
class AvatarUploadResponse {
  final String avatarUrl;

  AvatarUploadResponse({required this.avatarUrl});

  factory AvatarUploadResponse.fromJson(Map<String, dynamic> json) {
    return AvatarUploadResponse(
      avatarUrl: json['avatarUrl'] as String,
    );
  }

  Map<String, dynamic> toJson() => {'avatarUrl': avatarUrl};
}

/// Response from media upload
/// Backend returns: { files: [{ name, url, mediaId }] }
class MediaUploadResponse {
  final List<UploadedMediaFile> files;

  MediaUploadResponse({required this.files});

  factory MediaUploadResponse.fromJson(Map<String, dynamic> json) {
    final filesList = json['files'] as List<dynamic>? ?? [];
    return MediaUploadResponse(
      files: filesList
          .map((f) => UploadedMediaFile.fromJson(f as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'files': files.map((f) => f.toJson()).toList(),
  };
}

/// Single uploaded media file
class UploadedMediaFile {
  final String name;
  final String url;
  final String mediaId;

  UploadedMediaFile({
    required this.name,
    required this.url,
    required this.mediaId,
  });

  factory UploadedMediaFile.fromJson(Map<String, dynamic> json) {
    return UploadedMediaFile(
      name: json['name'] as String,
      url: json['url'] as String,
      mediaId: json['mediaId'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'url': url,
    'mediaId': mediaId,
  };
}
