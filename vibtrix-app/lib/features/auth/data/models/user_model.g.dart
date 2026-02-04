// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
  id: json['id'] as String,
  username: json['username'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  name: json['name'] as String?,
  bio: json['bio'] as String?,
  profilePicture: json['profilePicture'] as String?,
  coverPicture: json['coverPicture'] as String?,
  isVerified: json['isVerified'] as bool? ?? false,
  isPrivate: json['isPrivate'] as bool? ?? false,
  followersCount: (json['followersCount'] as num?)?.toInt() ?? 0,
  followingCount: (json['followingCount'] as num?)?.toInt() ?? 0,
  postsCount: (json['postsCount'] as num?)?.toInt() ?? 0,
  totalLikes: (json['totalLikes'] as num?)?.toInt() ?? 0,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt:
      json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
  settings:
      json['settings'] == null
          ? null
          : UserSettings.fromJson(json['settings'] as Map<String, dynamic>),
  isFollowing: json['isFollowing'] as bool?,
  isFollowedBy: json['isFollowedBy'] as bool?,
  // Additional fields
  gender: json['gender'] as String?,
  whatsappNumber: json['whatsappNumber'] as String?,
  dateOfBirth: json['dateOfBirth'] as String?,
  onlineStatus: json['onlineStatus'] as String?,
  lastActiveAt: json['lastActiveAt'] == null
      ? null
      : DateTime.parse(json['lastActiveAt'] as String),
  role: json['role'] as String?,
  isActive: json['isActive'] as bool?,
  showOnlineStatus: json['showOnlineStatus'] as bool?,
  isProfilePublic: json['isProfilePublic'] as bool?,
  showWhatsappNumber: json['showWhatsappNumber'] as bool?,
  showDob: json['showDob'] as bool?,
  hideYear: json['hideYear'] as bool?,
  upiId: json['upiId'] as String?,
  showUpiId: json['showUpiId'] as bool?,
  socialLinks: json['socialLinks'] as Map<String, dynamic>?,
  interestedInModeling: json['interestedInModeling'] as bool?,
  photoshootPricePerDay: (json['photoshootPricePerDay'] as num?)?.toDouble(),
  videoAdsParticipation: json['videoAdsParticipation'] as bool?,
  interestedInBrandAmbassadorship: json['interestedInBrandAmbassadorship'] as bool?,
  brandAmbassadorshipPricing: (json['brandAmbassadorshipPricing'] as num?)?.toDouble(),
  brandPreferences: (json['brandPreferences'] as List<dynamic>?)?.map((e) => e as String).toList(),
);

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
  'id': instance.id,
  'username': instance.username,
  'email': instance.email,
  'phone': instance.phone,
  'name': instance.name,
  'bio': instance.bio,
  'profilePicture': instance.profilePicture,
  'coverPicture': instance.coverPicture,
  'isVerified': instance.isVerified,
  'isPrivate': instance.isPrivate,
  'followersCount': instance.followersCount,
  'followingCount': instance.followingCount,
  'postsCount': instance.postsCount,
  'totalLikes': instance.totalLikes,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'settings': instance.settings?.toJson(),
  'isFollowing': instance.isFollowing,
  'isFollowedBy': instance.isFollowedBy,
  'gender': instance.gender,
  'whatsappNumber': instance.whatsappNumber,
  'dateOfBirth': instance.dateOfBirth,
  'onlineStatus': instance.onlineStatus,
  'lastActiveAt': instance.lastActiveAt?.toIso8601String(),
  'role': instance.role,
  'isActive': instance.isActive,
  'showOnlineStatus': instance.showOnlineStatus,
  'isProfilePublic': instance.isProfilePublic,
  'showWhatsappNumber': instance.showWhatsappNumber,
  'showDob': instance.showDob,
  'hideYear': instance.hideYear,
  'upiId': instance.upiId,
  'showUpiId': instance.showUpiId,
  'socialLinks': instance.socialLinks,
  'interestedInModeling': instance.interestedInModeling,
  'photoshootPricePerDay': instance.photoshootPricePerDay,
  'videoAdsParticipation': instance.videoAdsParticipation,
  'interestedInBrandAmbassadorship': instance.interestedInBrandAmbassadorship,
  'brandAmbassadorshipPricing': instance.brandAmbassadorshipPricing,
  'brandPreferences': instance.brandPreferences,
};

UserSettings _$UserSettingsFromJson(Map<String, dynamic> json) => UserSettings(
  pushNotifications: json['pushNotifications'] as bool? ?? true,
  emailNotifications: json['emailNotifications'] as bool? ?? true,
  privateAccount: json['privateAccount'] as bool? ?? false,
  showOnlineStatus: json['showOnlineStatus'] as bool? ?? true,
  language: json['language'] as String? ?? 'en',
  theme: json['theme'] as String? ?? 'system',
);

Map<String, dynamic> _$UserSettingsToJson(UserSettings instance) =>
    <String, dynamic>{
      'pushNotifications': instance.pushNotifications,
      'emailNotifications': instance.emailNotifications,
      'privateAccount': instance.privateAccount,
      'showOnlineStatus': instance.showOnlineStatus,
      'language': instance.language,
      'theme': instance.theme,
    };

UserProfileModel _$UserProfileModelFromJson(Map<String, dynamic> json) =>
    UserProfileModel(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      name: json['name'] as String?,
      bio: json['bio'] as String?,
      profilePicture: json['profilePicture'] as String?,
      coverPicture: json['coverPicture'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      isPrivate: json['isPrivate'] as bool? ?? false,
      followersCount: (json['followersCount'] as num?)?.toInt() ?? 0,
      followingCount: (json['followingCount'] as num?)?.toInt() ?? 0,
      postsCount: (json['postsCount'] as num?)?.toInt() ?? 0,
      totalLikes: (json['totalLikes'] as num?)?.toInt() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt:
          json['updatedAt'] == null
              ? null
              : DateTime.parse(json['updatedAt'] as String),
      settings:
          json['settings'] == null
              ? null
              : UserSettings.fromJson(json['settings'] as Map<String, dynamic>),
      isFollowing: json['isFollowing'] as bool?,
      isFollowedBy: json['isFollowedBy'] as bool?,
      // Additional fields from UserModel
      gender: json['gender'] as String?,
      whatsappNumber: json['whatsappNumber'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      onlineStatus: json['onlineStatus'] as String?,
      lastActiveAt: json['lastActiveAt'] == null
          ? null
          : DateTime.parse(json['lastActiveAt'] as String),
      role: json['role'] as String?,
      isActive: json['isActive'] as bool?,
      showOnlineStatus: json['showOnlineStatus'] as bool?,
      isProfilePublic: json['isProfilePublic'] as bool?,
      showWhatsappNumber: json['showWhatsappNumber'] as bool?,
      showDob: json['showDob'] as bool?,
      hideYear: json['hideYear'] as bool?,
      upiId: json['upiId'] as String?,
      showUpiId: json['showUpiId'] as bool?,
      socialLinks: json['socialLinks'] as Map<String, dynamic>?,
      interestedInModeling: json['interestedInModeling'] as bool?,
      photoshootPricePerDay: (json['photoshootPricePerDay'] as num?)?.toDouble(),
      videoAdsParticipation: json['videoAdsParticipation'] as bool?,
      interestedInBrandAmbassadorship: json['interestedInBrandAmbassadorship'] as bool?,
      brandAmbassadorshipPricing: (json['brandAmbassadorshipPricing'] as num?)?.toDouble(),
      brandPreferences: (json['brandPreferences'] as List<dynamic>?)?.map((e) => e as String).toList(),
      // UserProfileModel specific fields
      isBlocked: json['isBlocked'] as bool?,
      hasRequestedFollow: json['hasRequestedFollow'] as bool?,
    );

Map<String, dynamic> _$UserProfileModelToJson(UserProfileModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'email': instance.email,
      'phone': instance.phone,
      'name': instance.name,
      'bio': instance.bio,
      'profilePicture': instance.profilePicture,
      'coverPicture': instance.coverPicture,
      'isVerified': instance.isVerified,
      'isPrivate': instance.isPrivate,
      'followersCount': instance.followersCount,
      'followingCount': instance.followingCount,
      'postsCount': instance.postsCount,
      'totalLikes': instance.totalLikes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'settings': instance.settings?.toJson(),
      'isFollowing': instance.isFollowing,
      'isFollowedBy': instance.isFollowedBy,
      // Additional fields from UserModel
      'gender': instance.gender,
      'whatsappNumber': instance.whatsappNumber,
      'dateOfBirth': instance.dateOfBirth,
      'onlineStatus': instance.onlineStatus,
      'lastActiveAt': instance.lastActiveAt?.toIso8601String(),
      'role': instance.role,
      'isActive': instance.isActive,
      'showOnlineStatus': instance.showOnlineStatus,
      'isProfilePublic': instance.isProfilePublic,
      'showWhatsappNumber': instance.showWhatsappNumber,
      'showDob': instance.showDob,
      'hideYear': instance.hideYear,
      'upiId': instance.upiId,
      'showUpiId': instance.showUpiId,
      'socialLinks': instance.socialLinks,
      'interestedInModeling': instance.interestedInModeling,
      'photoshootPricePerDay': instance.photoshootPricePerDay,
      'videoAdsParticipation': instance.videoAdsParticipation,
      'interestedInBrandAmbassadorship': instance.interestedInBrandAmbassadorship,
      'brandAmbassadorshipPricing': instance.brandAmbassadorshipPricing,
      'brandPreferences': instance.brandPreferences,
      // UserProfileModel specific fields
      'isBlocked': instance.isBlocked,
      'hasRequestedFollow': instance.hasRequestedFollow,
    };

SimpleUserModel _$SimpleUserModelFromJson(Map<String, dynamic> json) =>
    SimpleUserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      name: json['name'] as String?,
      profilePicture: json['profilePicture'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      bio: json['bio'] as String?,
      isFollowing: json['isFollowing'] as bool?,
      isFollowedBy: json['isFollowedBy'] as bool?,
      followersCount: (json['followersCount'] as num?)?.toInt(),
      followingCount: (json['followingCount'] as num?)?.toInt(),
    );

Map<String, dynamic> _$SimpleUserModelToJson(SimpleUserModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'name': instance.name,
      'profilePicture': instance.profilePicture,
      'isVerified': instance.isVerified,
      'bio': instance.bio,
      'isFollowing': instance.isFollowing,
      'isFollowedBy': instance.isFollowedBy,
      'followersCount': instance.followersCount,
      'followingCount': instance.followingCount,
    };
