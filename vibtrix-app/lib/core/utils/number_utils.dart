/// Number utility functions for formatting

import 'package:intl/intl.dart';

class NumberUtils {
  NumberUtils._();

  /// Format number with compact notation (e.g., 1.2K, 3.5M)
  static String formatCompact(int number) {
    if (number < 1000) {
      return number.toString();
    } else if (number < 1000000) {
      final value = number / 1000;
      return '${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 1)}K';
    } else if (number < 1000000000) {
      final value = number / 1000000;
      return '${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 1)}M';
    } else {
      final value = number / 1000000000;
      return '${value.toStringAsFixed(value.truncateToDouble() == value ? 0 : 1)}B';
    }
  }

  /// Format number with thousand separators (e.g., 1,234,567)
  static String formatWithCommas(int number) {
    return NumberFormat('#,###').format(number);
  }

  /// Format currency (Indian Rupees)
  static String formatCurrency(double amount, {String symbol = '₹'}) {
    final formatter = NumberFormat.currency(
      symbol: symbol,
      decimalDigits: 2,
      locale: 'en_IN',
    );
    return formatter.format(amount);
  }

  /// Format currency compact (e.g., ₹1.2K)
  static String formatCurrencyCompact(double amount, {String symbol = '₹'}) {
    if (amount < 1000) {
      return '$symbol${amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2)}';
    } else if (amount < 100000) {
      final value = amount / 1000;
      return '$symbol${value.toStringAsFixed(1)}K';
    } else if (amount < 10000000) {
      final value = amount / 100000;
      return '$symbol${value.toStringAsFixed(1)}L';
    } else {
      final value = amount / 10000000;
      return '$symbol${value.toStringAsFixed(1)}Cr';
    }
  }

  /// Format percentage
  static String formatPercentage(double value, {int decimals = 1}) {
    return '${value.toStringAsFixed(decimals)}%';
  }

  /// Format file size (bytes to KB, MB, GB)
  static String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
    }
  }

  /// Format duration in seconds to MM:SS or HH:MM:SS
  static String formatVideoDuration(int seconds) {
    final duration = Duration(seconds: seconds);
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    final secs = duration.inSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  /// Format ordinal number (1st, 2nd, 3rd, etc.)
  static String formatOrdinal(int number) {
    if (number <= 0) return number.toString();

    final lastDigit = number % 10;
    final lastTwoDigits = number % 100;

    String suffix;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      suffix = 'th';
    } else {
      switch (lastDigit) {
        case 1:
          suffix = 'st';
          break;
        case 2:
          suffix = 'nd';
          break;
        case 3:
          suffix = 'rd';
          break;
        default:
          suffix = 'th';
      }
    }

    return '$number$suffix';
  }

  /// Format rank with medal emoji
  static String formatRank(int rank) {
    switch (rank) {
      case 1:
        return '🥇 1st';
      case 2:
        return '🥈 2nd';
      case 3:
        return '🥉 3rd';
      default:
        return formatOrdinal(rank);
    }
  }

  /// Clamp value between min and max
  static T clamp<T extends num>(T value, T min, T max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  /// Linear interpolation
  static double lerp(double a, double b, double t) {
    return a + (b - a) * t;
  }

  /// Map value from one range to another
  static double mapRange(
    double value,
    double inMin,
    double inMax,
    double outMin,
    double outMax,
  ) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}
