import 'package:json_annotation/json_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

/// User model that handles both API response formats
/// API returns: displayName, avatarUrl, _count, isProfilePublic, etc.
/// App uses: name, profilePicture, followersCount, isPrivate, etc.
@JsonSerializable()
class UserModel {
  final String id;
  final String username;
  final String? email;
  final String? phone;
  final String? name;
  final String? bio;
  final String? profilePicture;
  final String? coverPicture;
  final bool isVerified;
  final bool isPrivate;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final int totalLikes;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final UserSettings? settings;
  // Social status fields (nullable for own profile)
  final bool? isFollowing;
  final bool? isFollowedBy;
  // Additional fields from backend /users/me
  final String? gender;
  final String? whatsappNumber;
  final String? dateOfBirth;
  final String? onlineStatus;
  final DateTime? lastActiveAt;
  final String? role;
  final bool? isActive;
  // Privacy settings
  final bool? showOnlineStatus;
  final bool? isProfilePublic;
  final bool? showWhatsappNumber;
  final bool? showDob;
  final bool? hideYear;
  final String? upiId;
  final bool? showUpiId;
  final Map<String, dynamic>? socialLinks;
  // Modeling features
  final bool? interestedInModeling;
  final double? photoshootPricePerDay;
  final bool? videoAdsParticipation;
  // Brand Ambassadorship
  final bool? interestedInBrandAmbassadorship;
  final double? brandAmbassadorshipPricing;
  final List<String>? brandPreferences;

  const UserModel({
    required this.id,
    required this.username,
    this.email,
    this.phone,
    this.name,
    this.bio,
    this.profilePicture,
    this.coverPicture,
    this.isVerified = false,
    this.isPrivate = false,
    this.followersCount = 0,
    this.followingCount = 0,
    this.postsCount = 0,
    this.totalLikes = 0,
    required this.createdAt,
    this.updatedAt,
    this.settings,
    this.isFollowing,
    this.isFollowedBy,
    this.gender,
    this.whatsappNumber,
    this.dateOfBirth,
    this.onlineStatus,
    this.lastActiveAt,
    this.role,
    this.isActive,
    this.showOnlineStatus,
    this.isProfilePublic,
    this.showWhatsappNumber,
    this.showDob,
    this.hideYear,
    this.upiId,
    this.showUpiId,
    this.socialLinks,
    this.interestedInModeling,
    this.photoshootPricePerDay,
    this.videoAdsParticipation,
    this.interestedInBrandAmbassadorship,
    this.brandAmbassadorshipPricing,
    this.brandPreferences,
  });

  /// Custom fromJson that handles API field name differences
  /// API returns: displayName, avatarUrl, _count, followers array
  /// App expects: name, profilePicture, followersCount, isFollowing
  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Handle _count object from API
    final count = json['_count'] as Map<String, dynamic>?;
    
    // Handle followers array to determine isFollowing status
    final followers = json['followers'] as List<dynamic>?;
    final isFollowingFromApi = followers != null && followers.isNotEmpty;
    
    // Parse dateOfBirth - can be string or null
    String? dateOfBirth;
    if (json['dateOfBirth'] != null) {
      dateOfBirth = json['dateOfBirth'].toString();
    }
    
    // Parse socialLinks
    Map<String, dynamic>? socialLinks;
    if (json['socialLinks'] != null && json['socialLinks'] is Map) {
      socialLinks = Map<String, dynamic>.from(json['socialLinks'] as Map);
    }
    
    // Parse brandPreferences
    List<String>? brandPreferences;
    if (json['brandPreferences'] != null && json['brandPreferences'] is List) {
      brandPreferences = (json['brandPreferences'] as List).map((e) => e.toString()).toList();
    }
    
    return UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String? ?? json['whatsappNumber'] as String?,
      // Handle both 'name' and 'displayName' from API
      name: json['name'] as String? ?? json['displayName'] as String?,
      bio: json['bio'] as String?,
      // Handle both 'profilePicture' and 'avatarUrl' from API
      profilePicture: json['profilePicture'] as String? ?? json['avatarUrl'] as String?,
      coverPicture: json['coverPicture'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      // Handle both 'isPrivate' and 'isProfilePublic' (inverted) from API
      isPrivate: json['isPrivate'] as bool? ?? 
                 (json['isProfilePublic'] != null ? !(json['isProfilePublic'] as bool) : false),
      // Handle counts from _count object or direct fields
      followersCount: count?['followers'] as int? ?? 
                      (json['followersCount'] as num?)?.toInt() ?? 0,
      followingCount: count?['following'] as int? ?? 
                      (json['followingCount'] as num?)?.toInt() ?? 0,
      postsCount: count?['posts'] as int? ?? 
                  (json['postsCount'] as num?)?.toInt() ?? 0,
      totalLikes: count?['likes'] as int? ?? (json['totalLikes'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      settings: json['settings'] == null
          ? null
          : UserSettings.fromJson(json['settings'] as Map<String, dynamic>),
      // Use explicit isFollowing or derive from followers array
      isFollowing: json['isFollowing'] as bool? ?? (isFollowingFromApi ? true : null),
      isFollowedBy: json['isFollowedBy'] as bool?,
      // Additional fields
      gender: json['gender'] as String?,
      whatsappNumber: json['whatsappNumber'] as String?,
      dateOfBirth: dateOfBirth,
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
      socialLinks: socialLinks,
      interestedInModeling: json['interestedInModeling'] as bool?,
      photoshootPricePerDay: (json['photoshootPricePerDay'] as num?)?.toDouble(),
      videoAdsParticipation: json['videoAdsParticipation'] as bool?,
      interestedInBrandAmbassadorship: json['interestedInBrandAmbassadorship'] as bool?,
      brandAmbassadorshipPricing: (json['brandAmbassadorshipPricing'] as num?)?.toDouble(),
      brandPreferences: brandPreferences,
    );
  }

  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  UserModel copyWith({
    String? id,
    String? username,
    String? email,
    String? phone,
    String? name,
    String? bio,
    String? profilePicture,
    String? coverPicture,
    bool? isVerified,
    bool? isPrivate,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    int? totalLikes,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserSettings? settings,
    bool? isFollowing,
    bool? isFollowedBy,
    String? gender,
    String? whatsappNumber,
    String? dateOfBirth,
    String? onlineStatus,
    DateTime? lastActiveAt,
    String? role,
    bool? isActive,
    bool? showOnlineStatus,
    bool? isProfilePublic,
    bool? showWhatsappNumber,
    bool? showDob,
    bool? hideYear,
    String? upiId,
    bool? showUpiId,
    Map<String, dynamic>? socialLinks,
    bool? interestedInModeling,
    double? photoshootPricePerDay,
    bool? videoAdsParticipation,
    bool? interestedInBrandAmbassadorship,
    double? brandAmbassadorshipPricing,
    List<String>? brandPreferences,
  }) {
    return UserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      bio: bio ?? this.bio,
      profilePicture: profilePicture ?? this.profilePicture,
      coverPicture: coverPicture ?? this.coverPicture,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      totalLikes: totalLikes ?? this.totalLikes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      settings: settings ?? this.settings,
      isFollowing: isFollowing ?? this.isFollowing,
      isFollowedBy: isFollowedBy ?? this.isFollowedBy,
      gender: gender ?? this.gender,
      whatsappNumber: whatsappNumber ?? this.whatsappNumber,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      onlineStatus: onlineStatus ?? this.onlineStatus,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      isProfilePublic: isProfilePublic ?? this.isProfilePublic,
      showWhatsappNumber: showWhatsappNumber ?? this.showWhatsappNumber,
      showDob: showDob ?? this.showDob,
      hideYear: hideYear ?? this.hideYear,
      upiId: upiId ?? this.upiId,
      showUpiId: showUpiId ?? this.showUpiId,
      socialLinks: socialLinks ?? this.socialLinks,
      interestedInModeling: interestedInModeling ?? this.interestedInModeling,
      photoshootPricePerDay: photoshootPricePerDay ?? this.photoshootPricePerDay,
      videoAdsParticipation: videoAdsParticipation ?? this.videoAdsParticipation,
      interestedInBrandAmbassadorship: interestedInBrandAmbassadorship ?? this.interestedInBrandAmbassadorship,
      brandAmbassadorshipPricing: brandAmbassadorshipPricing ?? this.brandAmbassadorshipPricing,
      brandPreferences: brandPreferences ?? this.brandPreferences,
    );
  }
}

@JsonSerializable()
class UserSettings {
  final bool pushNotifications;
  final bool emailNotifications;
  final bool privateAccount;
  final bool showOnlineStatus;
  final String language;
  final String theme;

  const UserSettings({
    this.pushNotifications = true,
    this.emailNotifications = true,
    this.privateAccount = false,
    this.showOnlineStatus = true,
    this.language = 'en',
    this.theme = 'system',
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) =>
      _$UserSettingsFromJson(json);

  Map<String, dynamic> toJson() => _$UserSettingsToJson(this);
}

@JsonSerializable()
class UserProfileModel extends UserModel {
  final bool? isBlocked;
  final bool? hasRequestedFollow;

  const UserProfileModel({
    required super.id,
    required super.username,
    super.email,
    super.phone,
    super.name,
    super.bio,
    super.profilePicture,
    super.coverPicture,
    super.isVerified,
    super.isPrivate,
    super.followersCount,
    super.followingCount,
    super.postsCount,
    super.totalLikes,
    required super.createdAt,
    super.updatedAt,
    super.settings,
    super.isFollowing,
    super.isFollowedBy,
    // Additional fields from UserModel
    super.gender,
    super.whatsappNumber,
    super.dateOfBirth,
    super.onlineStatus,
    super.lastActiveAt,
    super.role,
    super.isActive,
    super.showOnlineStatus,
    super.isProfilePublic,
    super.showWhatsappNumber,
    super.showDob,
    super.hideYear,
    super.upiId,
    super.showUpiId,
    super.socialLinks,
    super.interestedInModeling,
    super.photoshootPricePerDay,
    super.videoAdsParticipation,
    super.interestedInBrandAmbassadorship,
    super.brandAmbassadorshipPricing,
    super.brandPreferences,
    // UserProfileModel specific fields
    this.isBlocked,
    this.hasRequestedFollow,
  });

  /// Custom fromJson that handles API field name differences
  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    // Handle _count object from API
    final count = json['_count'] as Map<String, dynamic>?;
    
    // Handle followers array to determine isFollowing status
    final followers = json['followers'] as List<dynamic>?;
    final isFollowingFromApi = followers != null && followers.isNotEmpty;
    
    // Parse socialLinks
    Map<String, dynamic>? socialLinks;
    if (json['socialLinks'] != null && json['socialLinks'] is Map) {
      socialLinks = Map<String, dynamic>.from(json['socialLinks'] as Map);
    }
    
    // Parse brandPreferences
    List<String>? brandPreferences;
    if (json['brandPreferences'] != null && json['brandPreferences'] is List) {
      brandPreferences = (json['brandPreferences'] as List).map((e) => e.toString()).toList();
    }
    
    return UserProfileModel(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String? ?? json['whatsappNumber'] as String?,
      // Handle both 'name' and 'displayName' from API
      name: json['name'] as String? ?? json['displayName'] as String?,
      bio: json['bio'] as String?,
      // Handle both 'profilePicture' and 'avatarUrl' from API
      profilePicture: json['profilePicture'] as String? ?? json['avatarUrl'] as String?,
      coverPicture: json['coverPicture'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      // Handle both 'isPrivate' and 'isProfilePublic' (inverted) from API
      isPrivate: json['isPrivate'] as bool? ?? 
                 (json['isProfilePublic'] != null ? !(json['isProfilePublic'] as bool) : false),
      // Handle counts from _count object or direct fields
      followersCount: count?['followers'] as int? ?? 
                      (json['followersCount'] as num?)?.toInt() ?? 0,
      followingCount: count?['following'] as int? ?? 
                      (json['followingCount'] as num?)?.toInt() ?? 0,
      postsCount: count?['posts'] as int? ?? 
                  (json['postsCount'] as num?)?.toInt() ?? 0,
      totalLikes: (json['totalLikes'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
      settings: json['settings'] == null
          ? null
          : UserSettings.fromJson(json['settings'] as Map<String, dynamic>),
      // Use explicit isFollowing or derive from followers array
      isFollowing: json['isFollowing'] as bool? ?? (isFollowingFromApi ? true : null),
      isFollowedBy: json['isFollowedBy'] as bool?,
      // Additional fields
      gender: json['gender'] as String?,
      whatsappNumber: json['whatsappNumber'] as String?,
      dateOfBirth: json['dateOfBirth']?.toString(),
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
      socialLinks: socialLinks,
      interestedInModeling: json['interestedInModeling'] as bool?,
      photoshootPricePerDay: (json['photoshootPricePerDay'] as num?)?.toDouble(),
      videoAdsParticipation: json['videoAdsParticipation'] as bool?,
      interestedInBrandAmbassadorship: json['interestedInBrandAmbassadorship'] as bool?,
      brandAmbassadorshipPricing: (json['brandAmbassadorshipPricing'] as num?)?.toDouble(),
      brandPreferences: brandPreferences,
      // UserProfileModel specific
      isBlocked: json['isBlocked'] as bool?,
      hasRequestedFollow: json['hasRequestedFollow'] as bool?,
    );
  }

  @override
  Map<String, dynamic> toJson() => _$UserProfileModelToJson(this);

  @override
  UserProfileModel copyWith({
    String? id,
    String? username,
    String? email,
    String? phone,
    String? name,
    String? bio,
    String? profilePicture,
    String? coverPicture,
    bool? isVerified,
    bool? isPrivate,
    int? followersCount,
    int? followingCount,
    int? postsCount,
    int? totalLikes,
    DateTime? createdAt,
    DateTime? updatedAt,
    UserSettings? settings,
    bool? isFollowing,
    bool? isFollowedBy,
    // Additional fields from UserModel
    String? gender,
    String? whatsappNumber,
    String? dateOfBirth,
    String? onlineStatus,
    DateTime? lastActiveAt,
    String? role,
    bool? isActive,
    bool? showOnlineStatus,
    bool? isProfilePublic,
    bool? showWhatsappNumber,
    bool? showDob,
    bool? hideYear,
    String? upiId,
    bool? showUpiId,
    Map<String, dynamic>? socialLinks,
    bool? interestedInModeling,
    double? photoshootPricePerDay,
    bool? videoAdsParticipation,
    bool? interestedInBrandAmbassadorship,
    double? brandAmbassadorshipPricing,
    List<String>? brandPreferences,
    // UserProfileModel specific fields
    bool? isBlocked,
    bool? hasRequestedFollow,
  }) {
    return UserProfileModel(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      bio: bio ?? this.bio,
      profilePicture: profilePicture ?? this.profilePicture,
      coverPicture: coverPicture ?? this.coverPicture,
      isVerified: isVerified ?? this.isVerified,
      isPrivate: isPrivate ?? this.isPrivate,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      postsCount: postsCount ?? this.postsCount,
      totalLikes: totalLikes ?? this.totalLikes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      settings: settings ?? this.settings,
      isFollowing: isFollowing ?? this.isFollowing,
      isFollowedBy: isFollowedBy ?? this.isFollowedBy,
      isBlocked: isBlocked ?? this.isBlocked,
      hasRequestedFollow: hasRequestedFollow ?? this.hasRequestedFollow,
      // Additional fields from UserModel
      gender: gender ?? this.gender,
      whatsappNumber: whatsappNumber ?? this.whatsappNumber,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      onlineStatus: onlineStatus ?? this.onlineStatus,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      isProfilePublic: isProfilePublic ?? this.isProfilePublic,
      showWhatsappNumber: showWhatsappNumber ?? this.showWhatsappNumber,
      showDob: showDob ?? this.showDob,
      hideYear: hideYear ?? this.hideYear,
      upiId: upiId ?? this.upiId,
      showUpiId: showUpiId ?? this.showUpiId,
      socialLinks: socialLinks ?? this.socialLinks,
      interestedInModeling: interestedInModeling ?? this.interestedInModeling,
      photoshootPricePerDay: photoshootPricePerDay ?? this.photoshootPricePerDay,
      videoAdsParticipation: videoAdsParticipation ?? this.videoAdsParticipation,
      interestedInBrandAmbassadorship: interestedInBrandAmbassadorship ?? this.interestedInBrandAmbassadorship,
      brandAmbassadorshipPricing: brandAmbassadorshipPricing ?? this.brandAmbassadorshipPricing,
      brandPreferences: brandPreferences ?? this.brandPreferences,
    );
  }
}

@JsonSerializable()
class SimpleUserModel {
  final String id;
  final String username;
  final String? name;
  final String? profilePicture;
  final bool isVerified;
  final String? bio;
  final bool? isFollowing;
  final bool? isFollowedBy;
  final int? followersCount;
  final int? followingCount;

  const SimpleUserModel({
    required this.id,
    required this.username,
    this.name,
    this.profilePicture,
    this.isVerified = false,
    this.bio,
    this.isFollowing,
    this.isFollowedBy,
    this.followersCount,
    this.followingCount,
  });

  /// Custom fromJson that handles API field name differences
  /// API returns: displayName, avatarUrl, _count, followers array
  /// App expects: name, profilePicture
  factory SimpleUserModel.fromJson(Map<String, dynamic> json) {
    // Handle _count object from API
    final count = json['_count'] as Map<String, dynamic>?;
    
    // Handle followers array to determine isFollowing status
    final followers = json['followers'] as List<dynamic>?;
    final isFollowingFromApi = followers != null && followers.isNotEmpty;
    
    return SimpleUserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      // Handle both 'name' and 'displayName' from API
      name: json['name'] as String? ?? json['displayName'] as String?,
      // Handle both 'profilePicture' and 'avatarUrl' from API
      profilePicture: json['profilePicture'] as String? ?? json['avatarUrl'] as String?,
      isVerified: json['isVerified'] as bool? ?? false,
      bio: json['bio'] as String?,
      // Use explicit isFollowing, isFollowedByMe, or derive from followers array
      isFollowing: json['isFollowing'] as bool? ?? 
                   json['isFollowedByMe'] as bool? ?? 
                   (isFollowingFromApi ? true : null),
      isFollowedBy: json['isFollowedBy'] as bool? ?? json['isFollowingMe'] as bool?,
      followersCount: count?['followers'] as int? ?? 
                      (json['followersCount'] as num?)?.toInt(),
      followingCount: count?['following'] as int? ?? 
                      (json['followingCount'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() => _$SimpleUserModelToJson(this);

  SimpleUserModel copyWith({
    String? id,
    String? username,
    String? name,
    String? profilePicture,
    bool? isVerified,
    String? bio,
    bool? isFollowing,
    bool? isFollowedBy,
    int? followersCount,
    int? followingCount,
  }) {
    return SimpleUserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      name: name ?? this.name,
      profilePicture: profilePicture ?? this.profilePicture,
      isVerified: isVerified ?? this.isVerified,
      bio: bio ?? this.bio,
      isFollowing: isFollowing ?? this.isFollowing,
      isFollowedBy: isFollowedBy ?? this.isFollowedBy,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
    );
  }
}
