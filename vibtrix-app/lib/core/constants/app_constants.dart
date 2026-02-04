/// App-wide constants
class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'VidiBattle';
  static const String appTagline = 'Compete. Create. Conquer.';
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int messagesPageSize = 50;
  
  // Media Limits
  static const int maxImageSizeMB = 10;
  static const int maxVideoSizeMB = 100;
  static const int maxVideoDurationSeconds = 180;
  static const int maxFilesPerPost = 5;
  static const int maxFilesPerCompetitionEntry = 1;
  
  // Text Limits
  static const int maxPostLength = 2000;
  static const int maxCommentLength = 1000;
  static const int maxBioLength = 500;
  static const int maxUsernameLength = 30;
  static const int minUsernameLength = 3;
  static const int minPasswordLength = 8;
  
  // Cache Duration
  static const Duration feedCacheDuration = Duration(minutes: 5);
  static const Duration profileCacheDuration = Duration(minutes: 10);
  static const Duration settingsCacheDuration = Duration(minutes: 30);
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 350);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Deep Linking
  static const String deepLinkScheme = 'vidibattle';
  static const String deepLinkHost = 'app';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String onboardingKey = 'onboarding_complete';
  static const String fcmTokenKey = 'fcm_token';
}

/// Report Reasons for Users
enum UserReportReason {
  spam('SPAM', 'Spam'),
  harassment('HARASSMENT', 'Harassment'),
  hateSpecch('HATE_SPEECH', 'Hate Speech'),
  impersonation('IMPERSONATION', 'Impersonation'),
  inappropriateContent('INAPPROPRIATE_CONTENT', 'Inappropriate Content'),
  scam('SCAM', 'Scam'),
  underage('UNDERAGE', 'Underage User'),
  other('OTHER', 'Other');

  const UserReportReason(this.value, this.label);
  final String value;
  final String label;
}

/// Report Reasons for Posts
enum PostReportReason {
  spam('SPAM', 'Spam'),
  harassment('HARASSMENT', 'Harassment'),
  hateSpecch('HATE_SPEECH', 'Hate Speech'),
  violence('VIOLENCE', 'Violence'),
  nudity('NUDITY', 'Nudity'),
  falseInformation('FALSE_INFORMATION', 'False Information'),
  intellectualProperty('INTELLECTUAL_PROPERTY', 'Intellectual Property'),
  other('OTHER', 'Other');

  const PostReportReason(this.value, this.label);
  final String value;
  final String label;
}

/// Report Reasons for Comments
enum CommentReportReason {
  spam('SPAM', 'Spam'),
  harassment('HARASSMENT', 'Harassment'),
  hateSpecch('HATE_SPEECH', 'Hate Speech'),
  violence('VIOLENCE', 'Violence'),
  nudity('NUDITY', 'Nudity'),
  falseInformation('FALSE_INFORMATION', 'False Information'),
  other('OTHER', 'Other');

  const CommentReportReason(this.value, this.label);
  final String value;
  final String label;
}

/// Feedback Types
enum FeedbackType {
  bugReport('BUG_REPORT', 'Bug Report'),
  featureRequest('FEATURE_REQUEST', 'Feature Request'),
  generalFeedback('GENERAL_FEEDBACK', 'General Feedback'),
  complaint('COMPLAINT', 'Complaint'),
  question('QUESTION', 'Question'),
  other('OTHER', 'Other');

  const FeedbackType(this.value, this.label);
  final String value;
  final String label;
}

/// Notification Types
enum NotificationType {
  like('LIKE'),
  comment('COMMENT'),
  follow('FOLLOW'),
  followRequest('FOLLOW_REQUEST'),
  share('SHARE'),
  competition('COMPETITION'),
  system('SYSTEM');

  const NotificationType(this.value);
  final String value;
}

/// Media Types
enum MediaType {
  image('IMAGE'),
  video('VIDEO');

  const MediaType(this.value);
  final String value;
}

/// Competition Status
enum CompetitionStatus {
  upcoming('UPCOMING'),
  active('ACTIVE'),
  completed('COMPLETED');

  const CompetitionStatus(this.value);
  final String value;
}

/// Participant Status
enum ParticipantStatus {
  pending('PENDING'),
  paid('PAID'),
  approved('APPROVED'),
  rejected('REJECTED');

  const ParticipantStatus(this.value);
  final String value;
}

/// Sticker Position
enum StickerPosition {
  topLeft('TOP_LEFT'),
  topRight('TOP_RIGHT'),
  bottomLeft('BOTTOM_LEFT'),
  bottomRight('BOTTOM_RIGHT'),
  center('CENTER');

  const StickerPosition(this.value);
  final String value;
}
