/// Form validation utilities

class Validators {
  Validators._();

  /// Email validation
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email';
    }
    return null;
  }

  /// Password validation
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!value.contains(RegExp(r'[a-z]'))) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  /// Strict password validation (alias for password)
  static String? passwordStrict(String? value) => password(value);

  /// Simple password validation (less strict)
  static String? simplePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }

  /// Confirm password validation
  static String? Function(String?) confirmPassword(String password) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return 'Please confirm your password';
      }
      if (value != password) {
        return 'Passwords do not match';
      }
      return null;
    };
  }

  /// Username validation
  static String? username(String? value) {
    if (value == null || value.isEmpty) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 30) {
      return 'Username must be less than 30 characters';
    }
    final usernameRegex = RegExp(r'^[a-zA-Z0-9_]+$');
    if (!usernameRegex.hasMatch(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    if (value.startsWith('_') || value.endsWith('_')) {
      return 'Username cannot start or end with underscore';
    }
    return null;
  }

  /// Display name validation
  static String? displayName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Name is required';
    }
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.length > 50) {
      return 'Name must be less than 50 characters';
    }
    return null;
  }

  /// Phone number validation (Indian)
  static String? phoneNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    final cleanValue = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (!phoneRegex.hasMatch(cleanValue)) {
      return 'Please enter a valid 10-digit phone number';
    }
    return null;
  }

  /// Required field validation
  static String? required(String? value, [String? fieldName]) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  /// Minimum length validation
  static String? Function(String?) minLength(int length, [String? fieldName]) {
    return (String? value) {
      if (value == null || value.length < length) {
        return '${fieldName ?? 'This field'} must be at least $length characters';
      }
      return null;
    };
  }

  /// Maximum length validation
  static String? Function(String?) maxLength(int length, [String? fieldName]) {
    return (String? value) {
      if (value != null && value.length > length) {
        return '${fieldName ?? 'This field'} must be less than $length characters';
      }
      return null;
    };
  }

  /// Bio validation
  static String? bio(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Bio is optional
    }
    if (value.length > 160) {
      return 'Bio must be less than 160 characters';
    }
    return null;
  }

  /// Post caption validation
  static String? postCaption(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Caption is optional
    }
    if (value.length > 2200) {
      return 'Caption must be less than 2200 characters';
    }
    return null;
  }

  /// Comment validation
  static String? comment(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Comment cannot be empty';
    }
    if (value.length > 1000) {
      return 'Comment must be less than 1000 characters';
    }
    return null;
  }

  /// Chat message validation
  static String? chatMessage(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Message cannot be empty';
    }
    if (value.length > 5000) {
      return 'Message is too long';
    }
    return null;
  }

  /// Competition title validation
  static String? competitionTitle(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Title is required';
    }
    if (value.length < 5) {
      return 'Title must be at least 5 characters';
    }
    if (value.length > 100) {
      return 'Title must be less than 100 characters';
    }
    return null;
  }

  /// Competition description validation
  static String? competitionDescription(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Description is required';
    }
    if (value.length < 20) {
      return 'Description must be at least 20 characters';
    }
    if (value.length > 2000) {
      return 'Description must be less than 2000 characters';
    }
    return null;
  }

  /// Prize amount validation
  static String? prizeAmount(String? value) {
    if (value == null || value.isEmpty) {
      return 'Prize amount is required';
    }
    final amount = double.tryParse(value);
    if (amount == null) {
      return 'Please enter a valid amount';
    }
    if (amount < 0) {
      return 'Amount cannot be negative';
    }
    return null;
  }

  /// URL validation
  static String? url(String? value) {
    if (value == null || value.isEmpty) {
      return null; // URL is optional
    }
    final urlRegex = RegExp(
      r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
    );
    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL';
    }
    return null;
  }

  /// OTP validation
  static String? otp(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (value.length != 6) {
      return 'OTP must be 6 digits';
    }
    if (!RegExp(r'^\d{6}$').hasMatch(value)) {
      return 'OTP must contain only numbers';
    }
    return null;
  }

  /// Combine multiple validators
  static String? Function(String?) combine(
    List<String? Function(String?)> validators,
  ) {
    return (String? value) {
      for (final validator in validators) {
        final error = validator(value);
        if (error != null) {
          return error;
        }
      }
      return null;
    };
  }
}
