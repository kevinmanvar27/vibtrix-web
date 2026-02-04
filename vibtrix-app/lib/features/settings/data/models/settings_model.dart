import 'package:json_annotation/json_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'settings_model.g.dart';

@JsonSerializable()
class AppSettingsModel {
  final NotificationSettingsModel notifications;
  final PrivacySettingsModel privacy;
  final ContentSettingsModel content;
  final DisplaySettingsModel display;

  const AppSettingsModel({
    this.notifications = const NotificationSettingsModel(),
    this.privacy = const PrivacySettingsModel(),
    this.content = const ContentSettingsModel(),
    this.display = const DisplaySettingsModel(),
  });

  factory AppSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$AppSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppSettingsModelToJson(this);
}

@JsonSerializable()
class NotificationSettingsModel {
  final bool pushEnabled;
  final bool emailEnabled;
  final bool likesEnabled;
  final bool commentsEnabled;
  final bool followsEnabled;
  final bool mentionsEnabled;
  final bool competitionsEnabled;
  final bool messagesEnabled;
  final bool marketingEnabled;

  const NotificationSettingsModel({
    this.pushEnabled = true,
    this.emailEnabled = true,
    this.likesEnabled = true,
    this.commentsEnabled = true,
    this.followsEnabled = true,
    this.mentionsEnabled = true,
    this.competitionsEnabled = true,
    this.messagesEnabled = true,
    this.marketingEnabled = false,
  });

  factory NotificationSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$NotificationSettingsModelToJson(this);
}

@JsonSerializable()
class PrivacySettingsModel {
  final bool privateAccount;
  final bool showOnlineStatus;
  final bool showActivityStatus;
  final bool allowTagging;
  final bool allowMentions;
  final MessagePrivacy messagePrivacy;
  final CommentPrivacy commentPrivacy;

  const PrivacySettingsModel({
    this.privateAccount = false,
    this.showOnlineStatus = true,
    this.showActivityStatus = true,
    this.allowTagging = true,
    this.allowMentions = true,
    this.messagePrivacy = MessagePrivacy.everyone,
    this.commentPrivacy = CommentPrivacy.everyone,
  });

  factory PrivacySettingsModel.fromJson(Map<String, dynamic> json) =>
      _$PrivacySettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$PrivacySettingsModelToJson(this);
}

enum MessagePrivacy {
  @JsonValue('everyone')
  everyone,
  @JsonValue('followers')
  followers,
  @JsonValue('none')
  none,
}

enum CommentPrivacy {
  @JsonValue('everyone')
  everyone,
  @JsonValue('followers')
  followers,
  @JsonValue('none')
  none,
}

@JsonSerializable()
class ContentSettingsModel {
  final bool autoplayVideos;
  final bool highQualityUploads;
  final bool dataSaverMode;
  final ContentFilter contentFilter;

  const ContentSettingsModel({
    this.autoplayVideos = true,
    this.highQualityUploads = true,
    this.dataSaverMode = false,
    this.contentFilter = ContentFilter.standard,
  });

  factory ContentSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$ContentSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$ContentSettingsModelToJson(this);
}

enum ContentFilter {
  @JsonValue('off')
  off,
  @JsonValue('standard')
  standard,
  @JsonValue('strict')
  strict,
}

@JsonSerializable()
class DisplaySettingsModel {
  final String theme; // 'light', 'dark', 'system'
  final String language;
  final bool reducedMotion;
  final double textScale;

  const DisplaySettingsModel({
    this.theme = 'system',
    this.language = 'en',
    this.reducedMotion = false,
    this.textScale = 1.0,
  });

  factory DisplaySettingsModel.fromJson(Map<String, dynamic> json) =>
      _$DisplaySettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$DisplaySettingsModelToJson(this);
}

@JsonSerializable()
class FeedStickerModel {
  final String id;
  final String name;
  final String imageUrl;
  final String? category;
  final bool isPremium;
  final int? price;
  final bool isOwned;

  const FeedStickerModel({
    required this.id,
    required this.name,
    required this.imageUrl,
    this.category,
    this.isPremium = false,
    this.price,
    this.isOwned = false,
  });

  factory FeedStickerModel.fromJson(Map<String, dynamic> json) =>
      _$FeedStickerModelFromJson(json);

  Map<String, dynamic> toJson() => _$FeedStickerModelToJson(this);
}

@JsonSerializable()
class AppConfigModel {
  final String minAppVersion;
  final String latestAppVersion;
  final bool forceUpdate;
  final String? updateUrl;
  final bool maintenanceMode;
  final String? maintenanceMessage;
  final Map<String, bool> featureFlags;
  final Map<String, dynamic>? remoteConfig;

  const AppConfigModel({
    required this.minAppVersion,
    required this.latestAppVersion,
    this.forceUpdate = false,
    this.updateUrl,
    this.maintenanceMode = false,
    this.maintenanceMessage,
    this.featureFlags = const {},
    this.remoteConfig,
  });

  factory AppConfigModel.fromJson(Map<String, dynamic> json) =>
      _$AppConfigModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppConfigModelToJson(this);

  bool isFeatureEnabled(String feature) => featureFlags[feature] ?? false;
}

// ============ ADDITIONAL MODELS ============

@JsonSerializable()
class AccountSettingsModel {
  final String email;
  final String? phone;
  final String username;
  final bool emailVerified;
  final bool phoneVerified;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? country;
  final String? timezone;

  const AccountSettingsModel({
    required this.email,
    this.phone,
    required this.username,
    this.emailVerified = false,
    this.phoneVerified = false,
    this.dateOfBirth,
    this.gender,
    this.country,
    this.timezone,
  });

  factory AccountSettingsModel.fromJson(Map<String, dynamic> json) =>
      _$AccountSettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$AccountSettingsModelToJson(this);
}

@JsonSerializable()
class SecuritySettingsModel {
  final bool twoFactorEnabled;
  final String? twoFactorMethod; // 'sms', 'email', 'authenticator'
  final DateTime? lastPasswordChange;
  final bool loginAlerts;
  final List<String> trustedDevices;
  final bool biometricEnabled;

  const SecuritySettingsModel({
    this.twoFactorEnabled = false,
    this.twoFactorMethod,
    this.lastPasswordChange,
    this.loginAlerts = true,
    this.trustedDevices = const [],
    this.biometricEnabled = false,
  });

  factory SecuritySettingsModel.fromJson(Map<String, dynamic> json) =>
      _$SecuritySettingsModelFromJson(json);

  Map<String, dynamic> toJson() => _$SecuritySettingsModelToJson(this);
}

@JsonSerializable()
class ContentPreferencesModel {
  final List<String> preferredCategories;
  final List<String> blockedCategories;
  final bool showMatureContent;
  final bool autoplayVideos;
  final String videoQuality; // 'auto', 'low', 'medium', 'high'
  final bool dataSaverMode;
  final String feedSortOrder; // 'latest', 'popular', 'following'

  const ContentPreferencesModel({
    this.preferredCategories = const [],
    this.blockedCategories = const [],
    this.showMatureContent = false,
    this.autoplayVideos = true,
    this.videoQuality = 'auto',
    this.dataSaverMode = false,
    this.feedSortOrder = 'latest',
  });

  factory ContentPreferencesModel.fromJson(Map<String, dynamic> json) =>
      _$ContentPreferencesModelFromJson(json);

  Map<String, dynamic> toJson() => _$ContentPreferencesModelToJson(this);
}

// ============ UPDATE REQUEST MODELS ============
// Note: UpdatePrivacySettingsRequest is defined in settings_api_service.dart

@JsonSerializable()
class UpdateAccountSettingsRequest {
  final String? phone;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? country;
  final String? timezone;

  const UpdateAccountSettingsRequest({
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.country,
    this.timezone,
  });

  factory UpdateAccountSettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateAccountSettingsRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateAccountSettingsRequestToJson(this);
}

@JsonSerializable()
class UpdateSecuritySettingsRequest {
  final bool? loginAlerts;
  final bool? biometricEnabled;

  const UpdateSecuritySettingsRequest({
    this.loginAlerts,
    this.biometricEnabled,
  });

  factory UpdateSecuritySettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateSecuritySettingsRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateSecuritySettingsRequestToJson(this);
}

@JsonSerializable()
class UpdateContentPreferencesRequest {
  final List<String>? preferredCategories;
  final List<String>? blockedCategories;
  final bool? showMatureContent;
  final bool? autoplayVideos;
  final String? videoQuality;
  final bool? dataSaverMode;
  final String? feedSortOrder;

  const UpdateContentPreferencesRequest({
    this.preferredCategories,
    this.blockedCategories,
    this.showMatureContent,
    this.autoplayVideos,
    this.videoQuality,
    this.dataSaverMode,
    this.feedSortOrder,
  });

  factory UpdateContentPreferencesRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateContentPreferencesRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateContentPreferencesRequestToJson(this);
}

// ============ ADDITIONAL MODELS FOR REPOSITORY ============

@JsonSerializable()
class LanguageModel {
  final String code;
  final String name;
  final String nativeName;
  final bool isRtl;

  const LanguageModel({
    required this.code,
    required this.name,
    required this.nativeName,
    this.isRtl = false,
  });

  factory LanguageModel.fromJson(Map<String, dynamic> json) =>
      _$LanguageModelFromJson(json);

  Map<String, dynamic> toJson() => _$LanguageModelToJson(this);
}

@JsonSerializable()
class DataUsageModel {
  final int totalBytes;
  final int cacheBytes;
  final int downloadsBytes;
  final int mediaBytes;
  final DateTime lastUpdated;

  const DataUsageModel({
    required this.totalBytes,
    required this.cacheBytes,
    required this.downloadsBytes,
    required this.mediaBytes,
    required this.lastUpdated,
  });

  factory DataUsageModel.fromJson(Map<String, dynamic> json) =>
      _$DataUsageModelFromJson(json);

  Map<String, dynamic> toJson() => _$DataUsageModelToJson(this);
}

@JsonSerializable()
class StorageInfoModel {
  final int totalSpace;
  final int usedSpace;
  final int availableSpace;
  final int appSize;

  const StorageInfoModel({
    required this.totalSpace,
    required this.usedSpace,
    required this.availableSpace,
    required this.appSize,
  });

  factory StorageInfoModel.fromJson(Map<String, dynamic> json) =>
      _$StorageInfoModelFromJson(json);

  Map<String, dynamic> toJson() => _$StorageInfoModelToJson(this);
}

@JsonSerializable()
class ActiveSessionModel {
  final String id;
  final String deviceName;
  final String deviceType;
  final String? location;
  final String? ipAddress;
  final DateTime lastActive;
  final bool isCurrent;

  const ActiveSessionModel({
    required this.id,
    required this.deviceName,
    required this.deviceType,
    this.location,
    this.ipAddress,
    required this.lastActive,
    this.isCurrent = false,
  });

  factory ActiveSessionModel.fromJson(Map<String, dynamic> json) =>
      _$ActiveSessionModelFromJson(json);

  Map<String, dynamic> toJson() => _$ActiveSessionModelToJson(this);
}

@JsonSerializable()
class TwoFactorSetupModel {
  final String secret;
  final String qrCodeUrl;
  final List<String> backupCodes;

  const TwoFactorSetupModel({
    required this.secret,
    required this.qrCodeUrl,
    required this.backupCodes,
  });

  factory TwoFactorSetupModel.fromJson(Map<String, dynamic> json) =>
      _$TwoFactorSetupModelFromJson(json);

  Map<String, dynamic> toJson() => _$TwoFactorSetupModelToJson(this);
}

@JsonSerializable()
class FaqModel {
  final String id;
  final String question;
  final String answer;
  final String? categoryId;
  final int order;

  const FaqModel({
    required this.id,
    required this.question,
    required this.answer,
    this.categoryId,
    this.order = 0,
  });

  factory FaqModel.fromJson(Map<String, dynamic> json) =>
      _$FaqModelFromJson(json);

  Map<String, dynamic> toJson() => _$FaqModelToJson(this);
}

@JsonSerializable()
class FaqCategoryModel {
  final String id;
  final String name;
  final String? icon;
  final int order;

  const FaqCategoryModel({
    required this.id,
    required this.name,
    this.icon,
    this.order = 0,
  });

  factory FaqCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$FaqCategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$FaqCategoryModelToJson(this);
}

@JsonSerializable()
class ContactInfoModel {
  final String email;
  final String? phone;
  final String? address;
  final Map<String, String>? socialLinks;

  const ContactInfoModel({
    required this.email,
    this.phone,
    this.address,
    this.socialLinks,
  });

  factory ContactInfoModel.fromJson(Map<String, dynamic> json) =>
      _$ContactInfoModelFromJson(json);

  Map<String, dynamic> toJson() => _$ContactInfoModelToJson(this);
}

@JsonSerializable()
class AppVersionModel {
  final String version;
  final String buildNumber;
  final DateTime releaseDate;
  final String? releaseNotes;
  final bool isMandatory;
  final String? downloadUrl;

  const AppVersionModel({
    required this.version,
    required this.buildNumber,
    required this.releaseDate,
    this.releaseNotes,
    this.isMandatory = false,
    this.downloadUrl,
  });

  factory AppVersionModel.fromJson(Map<String, dynamic> json) =>
      _$AppVersionModelFromJson(json);

  Map<String, dynamic> toJson() => _$AppVersionModelToJson(this);
}
