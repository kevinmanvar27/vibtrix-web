/// A smart avatar widget that handles both SVG and regular image URLs
/// 
/// Flutter's default image decoder doesn't support SVG format.
/// This widget detects SVG URLs (like DiceBear avatars) and uses flutter_svg,
/// while using CachedNetworkImage for regular images (PNG, JPG, etc.)

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../utils/url_utils.dart';

class NetworkAvatar extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final String? fallbackText;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final Widget? placeholder;
  final Widget? errorWidget;

  const NetworkAvatar({
    super.key,
    this.imageUrl,
    this.radius = 20,
    this.fallbackText,
    this.backgroundColor,
    this.foregroundColor,
    this.placeholder,
    this.errorWidget,
  });

  /// Check if the URL is an SVG image
  bool _isSvgUrl(String url) {
    final lowerUrl = url.toLowerCase();
    return lowerUrl.contains('.svg') || 
           lowerUrl.contains('svg?') ||
           lowerUrl.contains('/svg/');
  }

  /// Build fallback avatar with initials or icon
  Widget _buildFallback(BuildContext context) {
    final bgColor = backgroundColor ?? Theme.of(context).colorScheme.primaryContainer;
    final fgColor = foregroundColor ?? Theme.of(context).colorScheme.onPrimaryContainer;
    
    return CircleAvatar(
      radius: radius,
      backgroundColor: bgColor,
      child: fallbackText != null && fallbackText!.isNotEmpty
          ? Text(
              fallbackText!.substring(0, 1).toUpperCase(),
              style: TextStyle(
                color: fgColor,
                fontSize: radius * 0.8,
                fontWeight: FontWeight.bold,
              ),
            )
          : Icon(
              Icons.person,
              size: radius,
              color: fgColor,
            ),
    );
  }

  /// Build SVG avatar using flutter_svg with error handling
  Widget _buildSvgAvatar(BuildContext context, String url) {
    return ClipOval(
      child: SizedBox(
        width: radius * 2,
        height: radius * 2,
        child: SvgPicture.network(
          url,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          placeholderBuilder: (context) => placeholder ?? _buildFallback(context),
          // Handle SVG loading errors by showing fallback
          errorBuilder: (context, error, stackTrace) {
            debugPrint('SVG load error for $url: $error');
            return errorWidget ?? _buildFallback(context);
          },
        ),
      ),
    );
  }

  /// Build regular image avatar using CachedNetworkImage
  Widget _buildImageAvatar(BuildContext context, String url) {
    return CachedNetworkImage(
      imageUrl: url,
      imageBuilder: (context, imageProvider) => CircleAvatar(
        radius: radius,
        backgroundImage: imageProvider,
      ),
      placeholder: (context, url) => placeholder ?? _buildFallback(context),
      errorWidget: (context, url, error) => errorWidget ?? _buildFallback(context),
    );
  }

  @override
  Widget build(BuildContext context) {
    // No URL provided - show fallback
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _buildFallback(context);
    }

    // Use URL utility to handle relative URLs
    final url = UrlUtils.getFullMediaUrl(imageUrl!);
    
    // If URL is still empty after processing, show fallback
    if (url.isEmpty) {
      return _buildFallback(context);
    }

    // SVG URL - use flutter_svg
    if (_isSvgUrl(url)) {
      return _buildSvgAvatar(context, url);
    }

    // Regular image URL - use CachedNetworkImage
    return _buildImageAvatar(context, url);
  }
}

/// Extension to easily get avatar URL with fallback
extension AvatarUrlExtension on String? {
  /// Returns the URL or a default avatar URL based on seed
  String avatarUrlOr(String seed) {
    if (this != null && this!.isNotEmpty) {
      return this!;
    }
    // Use UI Avatars as fallback (returns PNG, not SVG)
    return 'https://ui-avatars.com/api/?name=${Uri.encodeComponent(seed)}&background=random&size=150';
  }
}
