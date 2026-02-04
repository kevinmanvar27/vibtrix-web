/// String utility functions

class StringUtils {
  StringUtils._();

  /// Capitalize first letter
  static String capitalize(String text) {
    if (text.isEmpty) return text;
    return text[0].toUpperCase() + text.substring(1);
  }

  /// Capitalize each word
  static String capitalizeWords(String text) {
    if (text.isEmpty) return text;
    return text.split(' ').map((word) => capitalize(word)).join(' ');
  }

  /// Truncate string with ellipsis
  static String truncate(String text, int maxLength, {String ellipsis = '...'}) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength - ellipsis.length)}$ellipsis';
  }

  /// Remove extra whitespace
  static String normalizeWhitespace(String text) {
    return text.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  /// Extract hashtags from text
  static List<String> extractHashtags(String text) {
    final regex = RegExp(r'#(\w+)');
    return regex.allMatches(text).map((m) => m.group(1)!).toList();
  }

  /// Extract mentions from text
  static List<String> extractMentions(String text) {
    final regex = RegExp(r'@(\w+)');
    return regex.allMatches(text).map((m) => m.group(1)!).toList();
  }

  /// Extract URLs from text
  static List<String> extractUrls(String text) {
    final regex = RegExp(
      r'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)',
    );
    return regex.allMatches(text).map((m) => m.group(0)!).toList();
  }

  /// Check if string contains only emojis
  static bool isOnlyEmojis(String text) {
    final emojiRegex = RegExp(
      r'^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\s]+$',
      unicode: true,
    );
    return emojiRegex.hasMatch(text.trim());
  }

  /// Count emojis in string
  static int countEmojis(String text) {
    final emojiRegex = RegExp(
      r'[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]',
      unicode: true,
    );
    return emojiRegex.allMatches(text).length;
  }

  /// Generate initials from name
  static String getInitials(String name, {int maxInitials = 2}) {
    final words = name.trim().split(RegExp(r'\s+'));
    final initials = words
        .take(maxInitials)
        .map((word) => word.isNotEmpty ? word[0].toUpperCase() : '')
        .join();
    return initials;
  }

  /// Format username with @ prefix
  static String formatUsername(String username) {
    if (username.startsWith('@')) return username;
    return '@$username';
  }

  /// Remove @ prefix from username
  static String cleanUsername(String username) {
    if (username.startsWith('@')) return username.substring(1);
    return username;
  }

  /// Check if string is a valid username
  static bool isValidUsername(String username) {
    final regex = RegExp(r'^[a-zA-Z0-9_]{3,30}$');
    return regex.hasMatch(username);
  }

  /// Check if string is a valid email
  static bool isValidEmail(String email) {
    final regex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    return regex.hasMatch(email);
  }

  /// Mask email for privacy
  static String maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;
    
    final name = parts[0];
    final domain = parts[1];
    
    if (name.length <= 2) {
      return '${name[0]}***@$domain';
    }
    
    return '${name.substring(0, 2)}***@$domain';
  }

  /// Mask phone number for privacy
  static String maskPhone(String phone) {
    if (phone.length < 4) return phone;
    return '******${phone.substring(phone.length - 4)}';
  }

  /// Generate a slug from text
  static String slugify(String text) {
    return text
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-')
        .replaceAll(RegExp(r'-+'), '-')
        .trim();
  }

  /// Pluralize word based on count
  static String pluralize(int count, String singular, [String? plural]) {
    if (count == 1) return singular;
    return plural ?? '${singular}s';
  }

  /// Format count with word (e.g., "5 likes", "1 comment")
  static String formatCount(int count, String singular, [String? plural]) {
    return '$count ${pluralize(count, singular, plural)}';
  }

  /// Check if string is null or empty
  static bool isNullOrEmpty(String? text) {
    return text == null || text.trim().isEmpty;
  }

  /// Get safe string (returns empty string if null)
  static String safe(String? text) {
    return text ?? '';
  }

  /// Remove HTML tags from string
  static String stripHtml(String htmlString) {
    return htmlString.replaceAll(RegExp(r'<[^>]*>'), '');
  }

  /// Escape HTML special characters
  static String escapeHtml(String text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  /// Convert newlines to <br> tags
  static String nl2br(String text) {
    return text.replaceAll('\n', '<br>');
  }

  /// Generate random string
  static String randomString(int length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    return List.generate(
      length,
      (index) => chars[(random + index) % chars.length],
    ).join();
  }
}
