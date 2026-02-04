// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppSettingsModel _$AppSettingsModelFromJson(Map<String, dynamic> json) =>
    AppSettingsModel(
      notifications:
          json['notifications'] == null
              ? const NotificationSettingsModel()
              : NotificationSettingsModel.fromJson(
                json['notifications'] as Map<String, dynamic>,
              ),
      privacy:
          json['privacy'] == null
              ? const PrivacySettingsModel()
              : PrivacySettingsModel.fromJson(
                json['privacy'] as Map<String, dynamic>,
              ),
      content:
          json['content'] == null
              ? const ContentSettingsModel()
              : ContentSettingsModel.fromJson(
                json['content'] as Map<String, dynamic>,
              ),
      display:
          json['display'] == null
              ? const DisplaySettingsModel()
              : DisplaySettingsModel.fromJson(
                json['display'] as Map<String, dynamic>,
              ),
    );

Map<String, dynamic> _$AppSettingsModelToJson(AppSettingsModel instance) =>
    <String, dynamic>{
      'notifications': instance.notifications,
      'privacy': instance.privacy,
      'content': instance.content,
      'display': instance.display,
    };

NotificationSettingsModel _$NotificationSettingsModelFromJson(
  Map<String, dynamic> json,
) => NotificationSettingsModel(
  pushEnabled: json['pushEnabled'] as bool? ?? true,
  emailEnabled: json['emailEnabled'] as bool? ?? true,
  likesEnabled: json['likesEnabled'] as bool? ?? true,
  commentsEnabled: json['commentsEnabled'] as bool? ?? true,
  followsEnabled: json['followsEnabled'] as bool? ?? true,
  mentionsEnabled: json['mentionsEnabled'] as bool? ?? true,
  competitionsEnabled: json['competitionsEnabled'] as bool? ?? true,
  messagesEnabled: json['messagesEnabled'] as bool? ?? true,
  marketingEnabled: json['marketingEnabled'] as bool? ?? false,
);

Map<String, dynamic> _$NotificationSettingsModelToJson(
  NotificationSettingsModel instance,
) => <String, dynamic>{
  'pushEnabled': instance.pushEnabled,
  'emailEnabled': instance.emailEnabled,
  'likesEnabled': instance.likesEnabled,
  'commentsEnabled': instance.commentsEnabled,
  'followsEnabled': instance.followsEnabled,
  'mentionsEnabled': instance.mentionsEnabled,
  'competitionsEnabled': instance.competitionsEnabled,
  'messagesEnabled': instance.messagesEnabled,
  'marketingEnabled': instance.marketingEnabled,
};

PrivacySettingsModel _$PrivacySettingsModelFromJson(
  Map<String, dynamic> json,
) => PrivacySettingsModel(
  privateAccount: json['privateAccount'] as bool? ?? false,
  showOnlineStatus: json['showOnlineStatus'] as bool? ?? true,
  showActivityStatus: json['showActivityStatus'] as bool? ?? true,
  allowTagging: json['allowTagging'] as bool? ?? true,
  allowMentions: json['allowMentions'] as bool? ?? true,
  messagePrivacy:
      $enumDecodeNullable(_$MessagePrivacyEnumMap, json['messagePrivacy']) ??
      MessagePrivacy.everyone,
  commentPrivacy:
      $enumDecodeNullable(_$CommentPrivacyEnumMap, json['commentPrivacy']) ??
      CommentPrivacy.everyone,
);

Map<String, dynamic> _$PrivacySettingsModelToJson(
  PrivacySettingsModel instance,
) => <String, dynamic>{
  'privateAccount': instance.privateAccount,
  'showOnlineStatus': instance.showOnlineStatus,
  'showActivityStatus': instance.showActivityStatus,
  'allowTagging': instance.allowTagging,
  'allowMentions': instance.allowMentions,
  'messagePrivacy': _$MessagePrivacyEnumMap[instance.messagePrivacy]!,
  'commentPrivacy': _$CommentPrivacyEnumMap[instance.commentPrivacy]!,
};

const _$MessagePrivacyEnumMap = {
  MessagePrivacy.everyone: 'everyone',
  MessagePrivacy.followers: 'followers',
  MessagePrivacy.none: 'none',
};

const _$CommentPrivacyEnumMap = {
  CommentPrivacy.everyone: 'everyone',
  CommentPrivacy.followers: 'followers',
  CommentPrivacy.none: 'none',
};

ContentSettingsModel _$ContentSettingsModelFromJson(
  Map<String, dynamic> json,
) => ContentSettingsModel(
  autoplayVideos: json['autoplayVideos'] as bool? ?? true,
  highQualityUploads: json['highQualityUploads'] as bool? ?? true,
  dataSaverMode: json['dataSaverMode'] as bool? ?? false,
  contentFilter:
      $enumDecodeNullable(_$ContentFilterEnumMap, json['contentFilter']) ??
      ContentFilter.standard,
);

Map<String, dynamic> _$ContentSettingsModelToJson(
  ContentSettingsModel instance,
) => <String, dynamic>{
  'autoplayVideos': instance.autoplayVideos,
  'highQualityUploads': instance.highQualityUploads,
  'dataSaverMode': instance.dataSaverMode,
  'contentFilter': _$ContentFilterEnumMap[instance.contentFilter]!,
};

const _$ContentFilterEnumMap = {
  ContentFilter.off: 'off',
  ContentFilter.standard: 'standard',
  ContentFilter.strict: 'strict',
};

DisplaySettingsModel _$DisplaySettingsModelFromJson(
  Map<String, dynamic> json,
) => DisplaySettingsModel(
  theme: json['theme'] as String? ?? 'system',
  language: json['language'] as String? ?? 'en',
  reducedMotion: json['reducedMotion'] as bool? ?? false,
  textScale: (json['textScale'] as num?)?.toDouble() ?? 1.0,
);

Map<String, dynamic> _$DisplaySettingsModelToJson(
  DisplaySettingsModel instance,
) => <String, dynamic>{
  'theme': instance.theme,
  'language': instance.language,
  'reducedMotion': instance.reducedMotion,
  'textScale': instance.textScale,
};

FeedStickerModel _$FeedStickerModelFromJson(Map<String, dynamic> json) =>
    FeedStickerModel(
      id: json['id'] as String,
      name: json['name'] as String,
      imageUrl: json['imageUrl'] as String,
      category: json['category'] as String?,
      isPremium: json['isPremium'] as bool? ?? false,
      price: (json['price'] as num?)?.toInt(),
      isOwned: json['isOwned'] as bool? ?? false,
    );

Map<String, dynamic> _$FeedStickerModelToJson(FeedStickerModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'imageUrl': instance.imageUrl,
      'category': instance.category,
      'isPremium': instance.isPremium,
      'price': instance.price,
      'isOwned': instance.isOwned,
    };

AppConfigModel _$AppConfigModelFromJson(Map<String, dynamic> json) =>
    AppConfigModel(
      minAppVersion: json['minAppVersion'] as String,
      latestAppVersion: json['latestAppVersion'] as String,
      forceUpdate: json['forceUpdate'] as bool? ?? false,
      updateUrl: json['updateUrl'] as String?,
      maintenanceMode: json['maintenanceMode'] as bool? ?? false,
      maintenanceMessage: json['maintenanceMessage'] as String?,
      featureFlags:
          (json['featureFlags'] as Map<String, dynamic>?)?.map(
            (k, e) => MapEntry(k, e as bool),
          ) ??
          const {},
      remoteConfig: json['remoteConfig'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$AppConfigModelToJson(AppConfigModel instance) =>
    <String, dynamic>{
      'minAppVersion': instance.minAppVersion,
      'latestAppVersion': instance.latestAppVersion,
      'forceUpdate': instance.forceUpdate,
      'updateUrl': instance.updateUrl,
      'maintenanceMode': instance.maintenanceMode,
      'maintenanceMessage': instance.maintenanceMessage,
      'featureFlags': instance.featureFlags,
      'remoteConfig': instance.remoteConfig,
    };

AccountSettingsModel _$AccountSettingsModelFromJson(
  Map<String, dynamic> json,
) => AccountSettingsModel(
  email: json['email'] as String,
  phone: json['phone'] as String?,
  username: json['username'] as String,
  emailVerified: json['emailVerified'] as bool? ?? false,
  phoneVerified: json['phoneVerified'] as bool? ?? false,
  dateOfBirth:
      json['dateOfBirth'] == null
          ? null
          : DateTime.parse(json['dateOfBirth'] as String),
  gender: json['gender'] as String?,
  country: json['country'] as String?,
  timezone: json['timezone'] as String?,
);

Map<String, dynamic> _$AccountSettingsModelToJson(
  AccountSettingsModel instance,
) => <String, dynamic>{
  'email': instance.email,
  'phone': instance.phone,
  'username': instance.username,
  'emailVerified': instance.emailVerified,
  'phoneVerified': instance.phoneVerified,
  'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
  'gender': instance.gender,
  'country': instance.country,
  'timezone': instance.timezone,
};

SecuritySettingsModel _$SecuritySettingsModelFromJson(
  Map<String, dynamic> json,
) => SecuritySettingsModel(
  twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
  twoFactorMethod: json['twoFactorMethod'] as String?,
  lastPasswordChange:
      json['lastPasswordChange'] == null
          ? null
          : DateTime.parse(json['lastPasswordChange'] as String),
  loginAlerts: json['loginAlerts'] as bool? ?? true,
  trustedDevices:
      (json['trustedDevices'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  biometricEnabled: json['biometricEnabled'] as bool? ?? false,
);

Map<String, dynamic> _$SecuritySettingsModelToJson(
  SecuritySettingsModel instance,
) => <String, dynamic>{
  'twoFactorEnabled': instance.twoFactorEnabled,
  'twoFactorMethod': instance.twoFactorMethod,
  'lastPasswordChange': instance.lastPasswordChange?.toIso8601String(),
  'loginAlerts': instance.loginAlerts,
  'trustedDevices': instance.trustedDevices,
  'biometricEnabled': instance.biometricEnabled,
};

ContentPreferencesModel _$ContentPreferencesModelFromJson(
  Map<String, dynamic> json,
) => ContentPreferencesModel(
  preferredCategories:
      (json['preferredCategories'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  blockedCategories:
      (json['blockedCategories'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  showMatureContent: json['showMatureContent'] as bool? ?? false,
  autoplayVideos: json['autoplayVideos'] as bool? ?? true,
  videoQuality: json['videoQuality'] as String? ?? 'auto',
  dataSaverMode: json['dataSaverMode'] as bool? ?? false,
  feedSortOrder: json['feedSortOrder'] as String? ?? 'latest',
);

Map<String, dynamic> _$ContentPreferencesModelToJson(
  ContentPreferencesModel instance,
) => <String, dynamic>{
  'preferredCategories': instance.preferredCategories,
  'blockedCategories': instance.blockedCategories,
  'showMatureContent': instance.showMatureContent,
  'autoplayVideos': instance.autoplayVideos,
  'videoQuality': instance.videoQuality,
  'dataSaverMode': instance.dataSaverMode,
  'feedSortOrder': instance.feedSortOrder,
};

UpdateAccountSettingsRequest _$UpdateAccountSettingsRequestFromJson(
  Map<String, dynamic> json,
) => UpdateAccountSettingsRequest(
  phone: json['phone'] as String?,
  dateOfBirth:
      json['dateOfBirth'] == null
          ? null
          : DateTime.parse(json['dateOfBirth'] as String),
  gender: json['gender'] as String?,
  country: json['country'] as String?,
  timezone: json['timezone'] as String?,
);

Map<String, dynamic> _$UpdateAccountSettingsRequestToJson(
  UpdateAccountSettingsRequest instance,
) => <String, dynamic>{
  'phone': instance.phone,
  'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
  'gender': instance.gender,
  'country': instance.country,
  'timezone': instance.timezone,
};

UpdateSecuritySettingsRequest _$UpdateSecuritySettingsRequestFromJson(
  Map<String, dynamic> json,
) => UpdateSecuritySettingsRequest(
  loginAlerts: json['loginAlerts'] as bool?,
  biometricEnabled: json['biometricEnabled'] as bool?,
);

Map<String, dynamic> _$UpdateSecuritySettingsRequestToJson(
  UpdateSecuritySettingsRequest instance,
) => <String, dynamic>{
  'loginAlerts': instance.loginAlerts,
  'biometricEnabled': instance.biometricEnabled,
};

UpdateContentPreferencesRequest _$UpdateContentPreferencesRequestFromJson(
  Map<String, dynamic> json,
) => UpdateContentPreferencesRequest(
  preferredCategories:
      (json['preferredCategories'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
  blockedCategories:
      (json['blockedCategories'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
  showMatureContent: json['showMatureContent'] as bool?,
  autoplayVideos: json['autoplayVideos'] as bool?,
  videoQuality: json['videoQuality'] as String?,
  dataSaverMode: json['dataSaverMode'] as bool?,
  feedSortOrder: json['feedSortOrder'] as String?,
);

Map<String, dynamic> _$UpdateContentPreferencesRequestToJson(
  UpdateContentPreferencesRequest instance,
) => <String, dynamic>{
  'preferredCategories': instance.preferredCategories,
  'blockedCategories': instance.blockedCategories,
  'showMatureContent': instance.showMatureContent,
  'autoplayVideos': instance.autoplayVideos,
  'videoQuality': instance.videoQuality,
  'dataSaverMode': instance.dataSaverMode,
  'feedSortOrder': instance.feedSortOrder,
};

LanguageModel _$LanguageModelFromJson(Map<String, dynamic> json) =>
    LanguageModel(
      code: json['code'] as String,
      name: json['name'] as String,
      nativeName: json['nativeName'] as String,
      isRtl: json['isRtl'] as bool? ?? false,
    );

Map<String, dynamic> _$LanguageModelToJson(LanguageModel instance) =>
    <String, dynamic>{
      'code': instance.code,
      'name': instance.name,
      'nativeName': instance.nativeName,
      'isRtl': instance.isRtl,
    };

DataUsageModel _$DataUsageModelFromJson(Map<String, dynamic> json) =>
    DataUsageModel(
      totalBytes: (json['totalBytes'] as num).toInt(),
      cacheBytes: (json['cacheBytes'] as num).toInt(),
      downloadsBytes: (json['downloadsBytes'] as num).toInt(),
      mediaBytes: (json['mediaBytes'] as num).toInt(),
      lastUpdated: DateTime.parse(json['lastUpdated'] as String),
    );

Map<String, dynamic> _$DataUsageModelToJson(DataUsageModel instance) =>
    <String, dynamic>{
      'totalBytes': instance.totalBytes,
      'cacheBytes': instance.cacheBytes,
      'downloadsBytes': instance.downloadsBytes,
      'mediaBytes': instance.mediaBytes,
      'lastUpdated': instance.lastUpdated.toIso8601String(),
    };

StorageInfoModel _$StorageInfoModelFromJson(Map<String, dynamic> json) =>
    StorageInfoModel(
      totalSpace: (json['totalSpace'] as num).toInt(),
      usedSpace: (json['usedSpace'] as num).toInt(),
      availableSpace: (json['availableSpace'] as num).toInt(),
      appSize: (json['appSize'] as num).toInt(),
    );

Map<String, dynamic> _$StorageInfoModelToJson(StorageInfoModel instance) =>
    <String, dynamic>{
      'totalSpace': instance.totalSpace,
      'usedSpace': instance.usedSpace,
      'availableSpace': instance.availableSpace,
      'appSize': instance.appSize,
    };

ActiveSessionModel _$ActiveSessionModelFromJson(Map<String, dynamic> json) =>
    ActiveSessionModel(
      id: json['id'] as String,
      deviceName: json['deviceName'] as String,
      deviceType: json['deviceType'] as String,
      location: json['location'] as String?,
      ipAddress: json['ipAddress'] as String?,
      lastActive: DateTime.parse(json['lastActive'] as String),
      isCurrent: json['isCurrent'] as bool? ?? false,
    );

Map<String, dynamic> _$ActiveSessionModelToJson(ActiveSessionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'deviceName': instance.deviceName,
      'deviceType': instance.deviceType,
      'location': instance.location,
      'ipAddress': instance.ipAddress,
      'lastActive': instance.lastActive.toIso8601String(),
      'isCurrent': instance.isCurrent,
    };

TwoFactorSetupModel _$TwoFactorSetupModelFromJson(Map<String, dynamic> json) =>
    TwoFactorSetupModel(
      secret: json['secret'] as String,
      qrCodeUrl: json['qrCodeUrl'] as String,
      backupCodes:
          (json['backupCodes'] as List<dynamic>)
              .map((e) => e as String)
              .toList(),
    );

Map<String, dynamic> _$TwoFactorSetupModelToJson(
  TwoFactorSetupModel instance,
) => <String, dynamic>{
  'secret': instance.secret,
  'qrCodeUrl': instance.qrCodeUrl,
  'backupCodes': instance.backupCodes,
};

FaqModel _$FaqModelFromJson(Map<String, dynamic> json) => FaqModel(
  id: json['id'] as String,
  question: json['question'] as String,
  answer: json['answer'] as String,
  categoryId: json['categoryId'] as String?,
  order: (json['order'] as num?)?.toInt() ?? 0,
);

Map<String, dynamic> _$FaqModelToJson(FaqModel instance) => <String, dynamic>{
  'id': instance.id,
  'question': instance.question,
  'answer': instance.answer,
  'categoryId': instance.categoryId,
  'order': instance.order,
};

FaqCategoryModel _$FaqCategoryModelFromJson(Map<String, dynamic> json) =>
    FaqCategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String?,
      order: (json['order'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$FaqCategoryModelToJson(FaqCategoryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'icon': instance.icon,
      'order': instance.order,
    };

ContactInfoModel _$ContactInfoModelFromJson(Map<String, dynamic> json) =>
    ContactInfoModel(
      email: json['email'] as String,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      socialLinks: (json['socialLinks'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
    );

Map<String, dynamic> _$ContactInfoModelToJson(ContactInfoModel instance) =>
    <String, dynamic>{
      'email': instance.email,
      'phone': instance.phone,
      'address': instance.address,
      'socialLinks': instance.socialLinks,
    };

AppVersionModel _$AppVersionModelFromJson(Map<String, dynamic> json) =>
    AppVersionModel(
      version: json['version'] as String,
      buildNumber: json['buildNumber'] as String,
      releaseDate: DateTime.parse(json['releaseDate'] as String),
      releaseNotes: json['releaseNotes'] as String?,
      isMandatory: json['isMandatory'] as bool? ?? false,
      downloadUrl: json['downloadUrl'] as String?,
    );

Map<String, dynamic> _$AppVersionModelToJson(AppVersionModel instance) =>
    <String, dynamic>{
      'version': instance.version,
      'buildNumber': instance.buildNumber,
      'releaseDate': instance.releaseDate.toIso8601String(),
      'releaseNotes': instance.releaseNotes,
      'isMandatory': instance.isMandatory,
      'downloadUrl': instance.downloadUrl,
    };
