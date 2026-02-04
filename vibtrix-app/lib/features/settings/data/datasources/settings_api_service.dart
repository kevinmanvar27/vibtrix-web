import 'package:dio/dio.dart';
import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import '../models/settings_model.dart';

part 'settings_api_service.g.dart';

@RestApi()
abstract class SettingsApiService {
  factory SettingsApiService(Dio dio, {String baseUrl}) = _SettingsApiService;

  // App settings
  @GET('/settings')
  Future<AppSettingsModel> getSettings();

  @PUT('/settings')
  Future<AppSettingsModel> updateSettings(@Body() UpdateSettingsRequest request);

  // Notification settings
  @GET('/settings/notifications')
  Future<NotificationSettingsModel> getNotificationSettings();

  @PUT('/settings/notifications')
  Future<NotificationSettingsModel> updateNotificationSettings(
    @Body() UpdateNotificationSettingsRequest request,
  );

  // Privacy settings
  @GET('/settings/privacy')
  Future<PrivacySettingsModel> getPrivacySettings();

  @PUT('/settings/privacy')
  Future<PrivacySettingsModel> updatePrivacySettings(
    @Body() UpdatePrivacySettingsRequest request,
  );

  // App config (public, no auth required)
  @GET('/config')
  Future<AppConfigModel> getAppConfig();

  // Feed stickers
  @GET('/stickers')
  Future<List<FeedStickerModel>> getStickers({
    @Query('category') String? category,
    @Query('active') bool? activeOnly,
  });

  @GET('/stickers/categories')
  Future<List<StickerCategoryModel>> getStickerCategories();

  // Account management
  @POST('/settings/account/deactivate')
  Future<void> deactivateAccount(@Body() DeactivateAccountRequest request);

  @POST('/settings/account/delete')
  Future<void> deleteAccount(@Body() DeleteAccountRequest request);

  @POST('/settings/account/export')
  Future<DataExportResponse> requestDataExport();

  @GET('/settings/account/export/{exportId}')
  Future<DataExportResponse> getDataExportStatus(@Path('exportId') String exportId);

  // Sessions
  @GET('/settings/sessions')
  Future<List<SessionModel>> getActiveSessions();

  @DELETE('/settings/sessions/{sessionId}')
  Future<void> revokeSession(@Path('sessionId') String sessionId);

  @DELETE('/settings/sessions')
  Future<void> revokeAllSessions();

  // Linked accounts
  @GET('/settings/linked-accounts')
  Future<List<LinkedAccountModel>> getLinkedAccounts();

  @POST('/settings/linked-accounts')
  Future<LinkedAccountModel> linkAccount(@Body() LinkAccountRequest request);

  @DELETE('/settings/linked-accounts/{provider}')
  Future<void> unlinkAccount(@Path('provider') String provider);

  // Account settings
  @GET('/settings/account')
  Future<AccountSettingsModel> getAccountSettings();

  @PUT('/settings/account')
  Future<void> updateAccountSettings(@Body() UpdateAccountSettingsRequest request);

  // Security settings
  @GET('/settings/security')
  Future<SecuritySettingsModel> getSecuritySettings();

  @PUT('/settings/security')
  Future<void> updateSecuritySettings(@Body() UpdateSecuritySettingsRequest request);

  // Content preferences
  @GET('/settings/content-preferences')
  Future<ContentPreferencesModel> getContentPreferences();

  @PUT('/settings/content-preferences')
  Future<void> updateContentPreferences(@Body() UpdateContentPreferencesRequest request);

  // Languages
  @GET('/settings/languages')
  Future<List<LanguageModel>> getAvailableLanguages();

  @PUT('/settings/language')
  Future<void> setLanguage(@Body() SetLanguageRequest request);

  // Data usage
  @GET('/settings/data-usage')
  Future<DataUsageModel> getDataUsage();

  @DELETE('/settings/cache')
  Future<void> clearCache();

  @DELETE('/settings/downloads')
  Future<void> clearDownloads();

  @GET('/settings/storage')
  Future<StorageInfoModel> getStorageInfo();

  // Two-factor authentication
  @POST('/settings/2fa/setup')
  Future<TwoFactorSetupModel> setupTwoFactor();

  @POST('/settings/2fa/enable')
  Future<void> enableTwoFactor(@Body() TwoFactorCodeRequest request);

  @POST('/settings/2fa/disable')
  Future<void> disableTwoFactor(@Body() TwoFactorCodeRequest request);

  @GET('/settings/2fa/status')
  Future<TwoFactorStatusResponse> getTwoFactorStatus();

  // Version check
  @GET('/app/version')
  Future<AppVersionModel> getLatestVersion();

  @GET('/app/check-update')
  Future<UpdateCheckResponse> checkForUpdates();

  // Help & Support
  @GET('/help/faqs')
  Future<List<FaqModel>> getFaqs();

  @GET('/help/faq-categories')
  Future<List<FaqCategoryModel>> getFaqCategories();

  @GET('/help/contact')
  Future<ContactInfoModel> getContactInfo();

  // Legal
  @GET('/legal/terms')
  Future<LegalDocumentResponse> getTermsOfService();

  @GET('/legal/privacy')
  Future<LegalDocumentResponse> getPrivacyPolicy();

  @GET('/legal/guidelines')
  Future<LegalDocumentResponse> getCommunityGuidelines();
}

// Request/Response models
@JsonSerializable()
class UpdateSettingsRequest {
  final String? language;
  final String? theme;
  final bool? autoPlayVideos;
  final bool? dataSaver;
  final String? videoQuality;

  UpdateSettingsRequest({
    this.language,
    this.theme,
    this.autoPlayVideos,
    this.dataSaver,
    this.videoQuality,
  });

  factory UpdateSettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateSettingsRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateSettingsRequestToJson(this);
}

@JsonSerializable()
class UpdateNotificationSettingsRequest {
  final bool? pushEnabled;
  final bool? emailEnabled;
  final bool? likesEnabled;
  final bool? commentsEnabled;
  final bool? followsEnabled;
  final bool? mentionsEnabled;
  final bool? competitionUpdates;
  final bool? chatMessages;
  final bool? marketingEmails;

  UpdateNotificationSettingsRequest({
    this.pushEnabled,
    this.emailEnabled,
    this.likesEnabled,
    this.commentsEnabled,
    this.followsEnabled,
    this.mentionsEnabled,
    this.competitionUpdates,
    this.chatMessages,
    this.marketingEmails,
  });

  factory UpdateNotificationSettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateNotificationSettingsRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateNotificationSettingsRequestToJson(this);
}

@JsonSerializable()
class UpdatePrivacySettingsRequest {
  final bool? privateAccount;
  final bool? showOnlineStatus;
  final bool? allowTagging;
  final bool? allowMentions;
  final String? whoCanMessage; // 'everyone', 'followers', 'nobody'
  final String? whoCanComment; // 'everyone', 'followers', 'nobody'

  UpdatePrivacySettingsRequest({
    this.privateAccount,
    this.showOnlineStatus,
    this.allowTagging,
    this.allowMentions,
    this.whoCanMessage,
    this.whoCanComment,
  });

  factory UpdatePrivacySettingsRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdatePrivacySettingsRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdatePrivacySettingsRequestToJson(this);
}

@JsonSerializable()
class DeactivateAccountRequest {
  final String password;
  final String? reason;

  DeactivateAccountRequest({required this.password, this.reason});

  factory DeactivateAccountRequest.fromJson(Map<String, dynamic> json) =>
      _$DeactivateAccountRequestFromJson(json);
  Map<String, dynamic> toJson() => _$DeactivateAccountRequestToJson(this);
}

@JsonSerializable()
class DeleteAccountRequest {
  final String password;
  final String? reason;
  final bool confirmDeletion;

  DeleteAccountRequest({
    required this.password,
    this.reason,
    required this.confirmDeletion,
  });

  factory DeleteAccountRequest.fromJson(Map<String, dynamic> json) =>
      _$DeleteAccountRequestFromJson(json);
  Map<String, dynamic> toJson() => _$DeleteAccountRequestToJson(this);
}

@JsonSerializable()
class DataExportResponse {
  final String exportId;
  final String status; // 'pending', 'processing', 'completed', 'failed'
  final String? downloadUrl;
  final DateTime? expiresAt;
  final DateTime requestedAt;

  DataExportResponse({
    required this.exportId,
    required this.status,
    this.downloadUrl,
    this.expiresAt,
    required this.requestedAt,
  });

  bool get isCompleted => status == 'completed';
  bool get isPending => status == 'pending' || status == 'processing';

  factory DataExportResponse.fromJson(Map<String, dynamic> json) =>
      _$DataExportResponseFromJson(json);
  Map<String, dynamic> toJson() => _$DataExportResponseToJson(this);
}

@JsonSerializable()
class SessionModel {
  final String id;
  final String deviceName;
  final String deviceType;
  final String? location;
  final String? ipAddress;
  final bool isCurrent;
  final DateTime lastActiveAt;
  final DateTime createdAt;

  SessionModel({
    required this.id,
    required this.deviceName,
    required this.deviceType,
    this.location,
    this.ipAddress,
    required this.isCurrent,
    required this.lastActiveAt,
    required this.createdAt,
  });

  factory SessionModel.fromJson(Map<String, dynamic> json) =>
      _$SessionModelFromJson(json);
  Map<String, dynamic> toJson() => _$SessionModelToJson(this);
}

@JsonSerializable()
class LinkedAccountModel {
  final String provider; // 'google', 'apple', 'facebook'
  final String? email;
  final String? name;
  final DateTime linkedAt;

  LinkedAccountModel({
    required this.provider,
    this.email,
    this.name,
    required this.linkedAt,
  });

  factory LinkedAccountModel.fromJson(Map<String, dynamic> json) =>
      _$LinkedAccountModelFromJson(json);
  Map<String, dynamic> toJson() => _$LinkedAccountModelToJson(this);
}

@JsonSerializable()
class LinkAccountRequest {
  final String provider;
  final String token;

  LinkAccountRequest({required this.provider, required this.token});

  factory LinkAccountRequest.fromJson(Map<String, dynamic> json) =>
      _$LinkAccountRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LinkAccountRequestToJson(this);
}

@JsonSerializable()
class StickerCategoryModel {
  final String id;
  final String name;
  final String? icon;
  final int order;

  StickerCategoryModel({
    required this.id,
    required this.name,
    this.icon,
    required this.order,
  });

  factory StickerCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$StickerCategoryModelFromJson(json);
  Map<String, dynamic> toJson() => _$StickerCategoryModelToJson(this);
}

@JsonSerializable()
class SetLanguageRequest {
  final String languageCode;

  SetLanguageRequest({required this.languageCode});

  factory SetLanguageRequest.fromJson(Map<String, dynamic> json) =>
      _$SetLanguageRequestFromJson(json);
  Map<String, dynamic> toJson() => _$SetLanguageRequestToJson(this);
}

@JsonSerializable()
class TwoFactorCodeRequest {
  final String code;

  TwoFactorCodeRequest({required this.code});

  factory TwoFactorCodeRequest.fromJson(Map<String, dynamic> json) =>
      _$TwoFactorCodeRequestFromJson(json);
  Map<String, dynamic> toJson() => _$TwoFactorCodeRequestToJson(this);
}

@JsonSerializable()
class TwoFactorStatusResponse {
  final bool enabled;
  final String? method;

  TwoFactorStatusResponse({required this.enabled, this.method});

  factory TwoFactorStatusResponse.fromJson(Map<String, dynamic> json) =>
      _$TwoFactorStatusResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TwoFactorStatusResponseToJson(this);
}

@JsonSerializable()
class UpdateCheckResponse {
  final bool updateAvailable;
  final String? latestVersion;
  final bool isMandatory;

  UpdateCheckResponse({
    required this.updateAvailable,
    this.latestVersion,
    this.isMandatory = false,
  });

  factory UpdateCheckResponse.fromJson(Map<String, dynamic> json) =>
      _$UpdateCheckResponseFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateCheckResponseToJson(this);
}

@JsonSerializable()
class LegalDocumentResponse {
  final String content;
  final DateTime lastUpdated;
  final String? version;

  LegalDocumentResponse({
    required this.content,
    required this.lastUpdated,
    this.version,
  });

  factory LegalDocumentResponse.fromJson(Map<String, dynamic> json) =>
      _$LegalDocumentResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LegalDocumentResponseToJson(this);
}
