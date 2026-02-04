/// Competitions state management using Riverpod
/// CONNECTED TO REAL API

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/competition_model.dart';
import '../../domain/repositories/competitions_repository.dart';

// ==================== STATE CLASSES ====================

class CompetitionsListState {
  final List<CompetitionModel> competitions;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String? nextCursor;
  final bool hasMore;
  final String? filterStatus;
  final String? filterType;

  const CompetitionsListState({
    this.competitions = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.nextCursor,
    this.hasMore = true,
    this.filterStatus,
    this.filterType,
  });

  CompetitionsListState copyWith({
    List<CompetitionModel>? competitions,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? nextCursor,
    bool? hasMore,
    String? filterStatus,
    String? filterType,
  }) {
    return CompetitionsListState(
      competitions: competitions ?? this.competitions,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      nextCursor: nextCursor ?? this.nextCursor,
      hasMore: hasMore ?? this.hasMore,
      filterStatus: filterStatus ?? this.filterStatus,
      filterType: filterType ?? this.filterType,
    );
  }
}

class CompetitionDetailState {
  final CompetitionModel? competition;
  final List<LeaderboardEntryModel> leaderboard;
  final bool isLoading;
  final bool isJoining;
  final String? error;

  const CompetitionDetailState({
    this.competition,
    this.leaderboard = const [],
    this.isLoading = false,
    this.isJoining = false,
    this.error,
  });

  CompetitionDetailState copyWith({
    CompetitionModel? competition,
    List<LeaderboardEntryModel>? leaderboard,
    bool? isLoading,
    bool? isJoining,
    String? error,
  }) {
    return CompetitionDetailState(
      competition: competition ?? this.competition,
      leaderboard: leaderboard ?? this.leaderboard,
      isLoading: isLoading ?? this.isLoading,
      isJoining: isJoining ?? this.isJoining,
      error: error,
    );
  }
}

// ==================== NOTIFIERS ====================

class CompetitionsListNotifier extends StateNotifier<CompetitionsListState> {
  final CompetitionsRepository _repository;

  CompetitionsListNotifier(this._repository) : super(const CompetitionsListState());

  Future<void> loadCompetitions({String? status, String? type, int limit = 20}) async {
    debugPrint('🏆 [CompetitionsProvider] Loading competitions (status: $status, type: $type)');
    state = state.copyWith(isLoading: true, error: null, filterStatus: status, filterType: type);

    final result = await _repository.getCompetitions(status: status, type: type, limit: limit);

    result.fold(
      (failure) {
        debugPrint('❌ [CompetitionsProvider] Failed to load competitions: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (competitions) {
        debugPrint('✅ [CompetitionsProvider] Loaded ${competitions.length} competitions');
        state = state.copyWith(
          isLoading: false,
          competitions: competitions,
          hasMore: competitions.length >= limit,
        );
      },
    );
  }

  Future<void> refresh() async {
    debugPrint('🏆 [CompetitionsProvider] Refreshing competitions');
    state = const CompetitionsListState();
    await loadCompetitions(status: state.filterStatus, type: state.filterType);
  }
}

class CompetitionDetailNotifier extends StateNotifier<CompetitionDetailState> {
  final CompetitionsRepository _repository;

  CompetitionDetailNotifier(this._repository) : super(const CompetitionDetailState());

  Future<void> loadCompetition(String competitionId) async {
    debugPrint('🏆 [CompetitionDetail] Loading competition: $competitionId');
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getCompetition(competitionId);

    result.fold(
      (failure) {
        debugPrint('❌ [CompetitionDetail] Failed to load: ${failure.message}');
        state = state.copyWith(
          isLoading: false,
          error: failure.message,
        );
      },
      (competition) {
        debugPrint('✅ [CompetitionDetail] Loaded: ${competition.name}');
        state = state.copyWith(
          isLoading: false,
          competition: competition,
        );
      },
    );
  }

  Future<void> loadLeaderboard(String competitionId) async {
    debugPrint('🏆 [CompetitionDetail] Loading leaderboard');
    final result = await _repository.getLeaderboard(competitionId);
    result.fold(
      (failure) {
        debugPrint('❌ [CompetitionDetail] Failed to load leaderboard');
      },
      (response) {
        debugPrint('✅ [CompetitionDetail] Loaded ${response.data.length} leaderboard entries');
        state = state.copyWith(leaderboard: response.data);
      },
    );
  }

  Future<void> loadAll(String competitionId) async {
    debugPrint('🏆 [CompetitionDetail] Loading all data for: $competitionId');
    await Future.wait([
      loadCompetition(competitionId),
      loadLeaderboard(competitionId),
    ]);
  }

  Future<bool> joinCompetition(String competitionId) async {
    debugPrint('🏆 [CompetitionDetail] Joining competition: $competitionId');
    state = state.copyWith(isJoining: true, error: null);

    final result = await _repository.joinCompetition(competitionId);

    return result.fold(
      (failure) {
        debugPrint('❌ [CompetitionDetail] Failed to join: ${failure.message}');
        state = state.copyWith(isJoining: false, error: failure.message);
        return false;
      },
      (participant) {
        debugPrint('✅ [CompetitionDetail] Joined successfully');
        // Update competition to reflect participation
        if (state.competition != null) {
          state = state.copyWith(
            isJoining: false,
            competition: state.competition!.copyWith(
              isParticipating: true,
              count: CompetitionCount(
                participants: state.competition!.participantsCount + 1,
                prizes: state.competition!.prizesCount,
              ),
            ),
          );
        }
        return true;
      },
    );
  }

  Future<bool> leaveCompetition(String competitionId) async {
    debugPrint('🏆 [CompetitionDetail] Leaving competition: $competitionId');
    final result = await _repository.leaveCompetition(competitionId);

    return result.fold(
      (failure) {
        debugPrint('❌ [CompetitionDetail] Failed to leave: ${failure.message}');
        state = state.copyWith(error: failure.message);
        return false;
      },
      (_) {
        debugPrint('✅ [CompetitionDetail] Left successfully');
        if (state.competition != null) {
          state = state.copyWith(
            competition: state.competition!.copyWith(
              isParticipating: false,
              count: CompetitionCount(
                participants: (state.competition!.participantsCount - 1).clamp(0, 999999),
                prizes: state.competition!.prizesCount,
              ),
            ),
          );
        }
        return true;
      },
    );
  }

  Future<bool> submitEntry(String competitionId, String postId) async {
    debugPrint('🏆 [CompetitionDetail] Submitting entry: $postId');
    final result = await _repository.submitEntry(competitionId, postId);
    return result.fold(
      (failure) {
        debugPrint('❌ [CompetitionDetail] Submit failed: ${failure.message}');
        state = state.copyWith(error: failure.message);
        return false;
      },
      (_) {
        debugPrint('✅ [CompetitionDetail] Entry submitted successfully');
        return true;
      },
    );
  }
}

// ==================== PROVIDERS ====================

final competitionsListProvider = StateNotifierProvider<CompetitionsListNotifier, CompetitionsListState>((ref) {
  return CompetitionsListNotifier(ref.watch(competitionsRepositoryProvider));
});

final competitionDetailProvider = StateNotifierProvider.family<CompetitionDetailNotifier, CompetitionDetailState, String>((ref, competitionId) {
  final notifier = CompetitionDetailNotifier(ref.watch(competitionsRepositoryProvider));
  // Auto-load when created
  notifier.loadAll(competitionId);
  return notifier;
});
