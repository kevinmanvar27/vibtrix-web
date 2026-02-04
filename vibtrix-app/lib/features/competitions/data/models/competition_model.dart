import 'package:json_annotation/json_annotation.dart';
import '../../../auth/data/models/user_model.dart';

part 'competition_model.g.dart';

/// Competition model that matches the backend API response
/// Backend returns: id, title, slug, description, isPaid, entryFee, mediaType,
/// isActive, completionReason, hasPrizes, createdAt, updatedAt, rounds, _count
@JsonSerializable()
class CompetitionModel {
  final String id;
  
  // Backend uses 'title', we map it to 'name' for display
  @JsonKey(name: 'title')
  final String name;
  
  final String? slug;
  final String? description;
  final String? thumbnailUrl;
  final String? bannerUrl;
  
  // Backend uses isActive boolean, we derive status from it and rounds
  @JsonKey(name: 'isActive')
  final bool? isActiveFlag;
  
  // Backend uses mediaType (e.g., 'video', 'image')
  @JsonKey(name: 'mediaType')
  final String? mediaType;
  
  @JsonKey(name: 'isPaid')
  final bool? isPaid;
  
  @JsonKey(name: 'hasPrizes')
  final bool? hasPrizes;
  
  @JsonKey(name: 'completionReason')
  final String? completionReason;
  
  // Participant count comes from _count.participants
  @JsonKey(name: '_count', fromJson: _parseCount)
  final CompetitionCount? count;
  
  final int? maxParticipants;
  final int? prizePool;
  final String? currency;
  
  // These may not be directly on the competition, but on rounds
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? registrationDeadline;
  
  @JsonKey(defaultValue: 0)
  final int entryFee;
  
  @JsonKey(defaultValue: false)
  final bool isParticipating;
  
  @JsonKey(defaultValue: false)
  final bool isFeatured;
  
  final List<CompetitionRoundModel>? rounds;
  final List<PrizeModel>? prizes;
  final CompetitionRulesModel? rules;
  final SimpleUserModel? creator;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const CompetitionModel({
    required this.id,
    required this.name,
    this.slug,
    this.description,
    this.thumbnailUrl,
    this.bannerUrl,
    this.isActiveFlag,
    this.mediaType,
    this.isPaid,
    this.hasPrizes,
    this.completionReason,
    this.count,
    this.maxParticipants,
    this.prizePool,
    this.currency,
    this.startDate,
    this.endDate,
    this.registrationDeadline,
    this.entryFee = 0,
    this.isParticipating = false,
    this.isFeatured = false,
    this.rounds,
    this.prizes,
    this.rules,
    this.creator,
    required this.createdAt,
    this.updatedAt,
  });

  factory CompetitionModel.fromJson(Map<String, dynamic> json) =>
      _$CompetitionModelFromJson(json);

  Map<String, dynamic> toJson() => _$CompetitionModelToJson(this);

  // Computed properties
  int get participantsCount => count?.participants ?? 0;
  int get prizesCount => count?.prizes ?? 0;
  
  // Derive status from isActive flag and rounds
  CompetitionStatus get status {
    if (completionReason != null) return CompetitionStatus.completed;
    if (isActiveFlag == false) return CompetitionStatus.draft;
    
    // Check rounds to determine if upcoming, active, or completed
    if (rounds != null && rounds!.isNotEmpty) {
      final now = DateTime.now();
      final firstRound = rounds!.first;
      final lastRound = rounds!.last;
      
      if (now.isBefore(firstRound.startDate)) {
        return CompetitionStatus.upcoming;
      } else if (now.isAfter(lastRound.endDate)) {
        return CompetitionStatus.completed;
      } else {
        return CompetitionStatus.active;
      }
    }
    
    return isActiveFlag == true ? CompetitionStatus.active : CompetitionStatus.upcoming;
  }
  
  // Derive type from mediaType
  CompetitionType get type {
    switch (mediaType?.toLowerCase()) {
      case 'video':
        return CompetitionType.voting;
      case 'image':
        return CompetitionType.voting;
      default:
        return CompetitionType.voting;
    }
  }
  
  // Computed start/end dates from rounds
  DateTime get effectiveStartDate {
    if (startDate != null) return startDate!;
    if (rounds != null && rounds!.isNotEmpty) {
      return rounds!.first.startDate;
    }
    return createdAt;
  }
  
  DateTime get effectiveEndDate {
    if (endDate != null) return endDate!;
    if (rounds != null && rounds!.isNotEmpty) {
      return rounds!.last.endDate;
    }
    return createdAt.add(const Duration(days: 30));
  }

  bool get isActive => status == CompetitionStatus.active;
  bool get isUpcoming => status == CompetitionStatus.upcoming;
  bool get isCompleted => status == CompetitionStatus.completed;
  bool get canJoin => 
      (status == CompetitionStatus.upcoming || status == CompetitionStatus.active) &&
      !isParticipating &&
      (maxParticipants == null || maxParticipants == 0 || participantsCount < maxParticipants!);

  CompetitionModel copyWith({
    String? id,
    String? name,
    String? slug,
    String? description,
    String? thumbnailUrl,
    String? bannerUrl,
    bool? isActiveFlag,
    String? mediaType,
    bool? isPaid,
    bool? hasPrizes,
    String? completionReason,
    CompetitionCount? count,
    int? maxParticipants,
    int? prizePool,
    String? currency,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? registrationDeadline,
    int? entryFee,
    bool? isParticipating,
    bool? isFeatured,
    List<CompetitionRoundModel>? rounds,
    List<PrizeModel>? prizes,
    CompetitionRulesModel? rules,
    SimpleUserModel? creator,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CompetitionModel(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      bannerUrl: bannerUrl ?? this.bannerUrl,
      isActiveFlag: isActiveFlag ?? this.isActiveFlag,
      mediaType: mediaType ?? this.mediaType,
      isPaid: isPaid ?? this.isPaid,
      hasPrizes: hasPrizes ?? this.hasPrizes,
      completionReason: completionReason ?? this.completionReason,
      count: count ?? this.count,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      prizePool: prizePool ?? this.prizePool,
      currency: currency ?? this.currency,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      entryFee: entryFee ?? this.entryFee,
      isParticipating: isParticipating ?? this.isParticipating,
      isFeatured: isFeatured ?? this.isFeatured,
      rounds: rounds ?? this.rounds,
      prizes: prizes ?? this.prizes,
      rules: rules ?? this.rules,
      creator: creator ?? this.creator,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

// Helper class for _count field
@JsonSerializable()
class CompetitionCount {
  final int participants;
  final int prizes;
  
  const CompetitionCount({
    this.participants = 0,
    this.prizes = 0,
  });
  
  factory CompetitionCount.fromJson(Map<String, dynamic> json) =>
      _$CompetitionCountFromJson(json);
  
  Map<String, dynamic> toJson() => _$CompetitionCountToJson(this);
}

CompetitionCount? _parseCount(dynamic json) {
  if (json == null) return null;
  if (json is Map<String, dynamic>) {
    return CompetitionCount.fromJson(json);
  }
  return null;
}

enum CompetitionStatus {
  @JsonValue('draft')
  draft,
  @JsonValue('upcoming')
  upcoming,
  @JsonValue('active')
  active,
  @JsonValue('voting')
  voting,
  @JsonValue('completed')
  completed,
  @JsonValue('cancelled')
  cancelled,
}

enum CompetitionType {
  @JsonValue('single_elimination')
  singleElimination,
  @JsonValue('double_elimination')
  doubleElimination,
  @JsonValue('round_robin')
  roundRobin,
  @JsonValue('voting')
  voting,
  @JsonValue('leaderboard')
  leaderboard,
}

/// Competition round model matching backend response
/// Backend returns: id, name, startDate, endDate, likesToPass, createdAt
@JsonSerializable()
class CompetitionRoundModel {
  final String id;
  final String? competitionId;
  final int? roundNumber;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  @JsonKey(name: 'likesToPass')
  final int? likesToPass;
  final DateTime? createdAt;

  const CompetitionRoundModel({
    required this.id,
    this.competitionId,
    this.roundNumber,
    required this.name,
    required this.startDate,
    required this.endDate,
    this.likesToPass,
    this.createdAt,
  });

  factory CompetitionRoundModel.fromJson(Map<String, dynamic> json) =>
      _$CompetitionRoundModelFromJson(json);

  Map<String, dynamic> toJson() => _$CompetitionRoundModelToJson(this);
  
  // Derive status from dates
  RoundStatus get status {
    final now = DateTime.now();
    if (now.isBefore(startDate)) return RoundStatus.pending;
    if (now.isAfter(endDate)) return RoundStatus.completed;
    return RoundStatus.active;
  }
  
  int get participantsCount => 0; // Not provided by backend
}

enum RoundStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
}

@JsonSerializable()
class PrizeModel {
  final int rank;
  final int amount;
  final String? currency;
  final String? description;
  final String? badgeUrl;

  const PrizeModel({
    required this.rank,
    required this.amount,
    this.currency,
    this.description,
    this.badgeUrl,
  });

  factory PrizeModel.fromJson(Map<String, dynamic> json) =>
      _$PrizeModelFromJson(json);

  Map<String, dynamic> toJson() => _$PrizeModelToJson(this);
}

@JsonSerializable()
class CompetitionRulesModel {
  final int? minVideoDuration;
  final int? maxVideoDuration;
  final List<String>? allowedFormats;
  final String? theme;
  final List<String>? guidelines;

  const CompetitionRulesModel({
    this.minVideoDuration,
    this.maxVideoDuration,
    this.allowedFormats,
    this.theme,
    this.guidelines,
  });

  factory CompetitionRulesModel.fromJson(Map<String, dynamic> json) =>
      _$CompetitionRulesModelFromJson(json);

  Map<String, dynamic> toJson() => _$CompetitionRulesModelToJson(this);
}

@JsonSerializable()
class ParticipantModel {
  final String id;
  final String competitionId;
  final String userId;
  final SimpleUserModel? user;
  final String? postId;
  final int rank;
  final int votes;
  final int score;
  final ParticipantStatus status;
  final DateTime joinedAt;

  const ParticipantModel({
    required this.id,
    required this.competitionId,
    required this.userId,
    this.user,
    this.postId,
    this.rank = 0,
    this.votes = 0,
    this.score = 0,
    required this.status,
    required this.joinedAt,
  });

  factory ParticipantModel.fromJson(Map<String, dynamic> json) =>
      _$ParticipantModelFromJson(json);

  Map<String, dynamic> toJson() => _$ParticipantModelToJson(this);
}

enum ParticipantStatus {
  @JsonValue('registered')
  registered,
  @JsonValue('active')
  active,
  @JsonValue('eliminated')
  eliminated,
  @JsonValue('winner')
  winner,
  @JsonValue('disqualified')
  disqualified,
}

@JsonSerializable()
class LeaderboardEntryModel {
  final int rank;
  final String odUserId;
  final SimpleUserModel? user;
  final int votes;
  final int score;
  final String? postId;
  final String? thumbnailUrl;

  const LeaderboardEntryModel({
    required this.rank,
    required this.odUserId,
    this.user,
    this.votes = 0,
    this.score = 0,
    this.postId,
    this.thumbnailUrl,
  });

  factory LeaderboardEntryModel.fromJson(Map<String, dynamic> json) =>
      _$LeaderboardEntryModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaderboardEntryModelToJson(this);
}

// ============ REQUEST MODELS ============

@JsonSerializable()
class CreateCompetitionRequest {
  final String name;
  final String? description;
  final String? thumbnailUrl;
  final String? bannerUrl;
  final CompetitionType type;
  final int? maxParticipants;
  final int? prizePool;
  final String? currency;
  final DateTime startDate;
  final DateTime endDate;
  final DateTime? registrationDeadline;
  final int? entryFee;
  final CompetitionRulesModel? rules;
  final List<PrizeModel>? prizes;

  const CreateCompetitionRequest({
    required this.name,
    this.description,
    this.thumbnailUrl,
    this.bannerUrl,
    required this.type,
    this.maxParticipants,
    this.prizePool,
    this.currency,
    required this.startDate,
    required this.endDate,
    this.registrationDeadline,
    this.entryFee,
    this.rules,
    this.prizes,
  });

  factory CreateCompetitionRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateCompetitionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$CreateCompetitionRequestToJson(this);
}

@JsonSerializable()
class UpdateCompetitionRequest {
  final String? name;
  final String? description;
  final String? thumbnailUrl;
  final String? bannerUrl;
  final int? maxParticipants;
  final int? prizePool;
  final String? currency;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? registrationDeadline;
  final int? entryFee;
  final CompetitionRulesModel? rules;
  final List<PrizeModel>? prizes;

  const UpdateCompetitionRequest({
    this.name,
    this.description,
    this.thumbnailUrl,
    this.bannerUrl,
    this.maxParticipants,
    this.prizePool,
    this.currency,
    this.startDate,
    this.endDate,
    this.registrationDeadline,
    this.entryFee,
    this.rules,
    this.prizes,
  });

  factory UpdateCompetitionRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateCompetitionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateCompetitionRequestToJson(this);
}

@JsonSerializable()
class JoinCompetitionRequest {
  final String? postId;
  final String? paymentId;

  const JoinCompetitionRequest({
    this.postId,
    this.paymentId,
  });

  factory JoinCompetitionRequest.fromJson(Map<String, dynamic> json) =>
      _$JoinCompetitionRequestFromJson(json);

  Map<String, dynamic> toJson() => _$JoinCompetitionRequestToJson(this);
}

@JsonSerializable()
class CompetitionCategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? iconUrl;

  const CompetitionCategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.iconUrl,
  });

  factory CompetitionCategoryModel.fromJson(Map<String, dynamic> json) =>
      _$CompetitionCategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$CompetitionCategoryModelToJson(this);
}
