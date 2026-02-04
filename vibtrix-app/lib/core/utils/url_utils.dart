import '../constants/api_constants.dart';

/// Utility class for URL handling
class UrlUtils {
  UrlUtils._();

  /// Get full URL for media assets
  /// Handles both absolute URLs and relative paths
  static String getFullMediaUrl(String? url) {
    if (url == null || url.isEmpty) {
      return '';
    }
    
    // Already a full URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Relative path - prepend base URL
    return '${ApiConstants.baseUrl}$url';
  }

  /// Get avatar URL with fallback handling
  static String? getAvatarUrl(String? url) {
    if (url == null || url.isEmpty) {
      return null;
    }
    return getFullMediaUrl(url);
  }

  /// Get thumbnail URL for posts
  /// Falls back to main URL if thumbnail not available
  static String getPostThumbnailUrl(String? thumbnailUrl, String? mainUrl) {
    if (thumbnailUrl != null && thumbnailUrl.isNotEmpty) {
      return getFullMediaUrl(thumbnailUrl);
    }
    if (mainUrl != null && mainUrl.isNotEmpty) {
      return getFullMediaUrl(mainUrl);
    }
    return '';
  }
}
