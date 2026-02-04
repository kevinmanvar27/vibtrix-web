/// Report state management using Riverpod
/// Handles reporting users, posts, comments, and other content

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/report_model.dart';
import '../../data/datasources/report_api_service.dart' show ReportReasonModel;
import '../../domain/repositories/report_repository.dart';

// ============================================================================
// Report State
// ============================================================================

class ReportState {
  final List<ReportReasonModel> reportReasons;
  final bool isLoading;
  final bool isSubmitting;
  final bool isSuccess;
  final String? errorMessage;
  final String? successMessage;

  const ReportState({
    this.reportReasons = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.isSuccess = false,
    this.errorMessage,
    this.successMessage,
  });

  ReportState copyWith({
    List<ReportReasonModel>? reportReasons,
    bool? isLoading,
    bool? isSubmitting,
    bool? isSuccess,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return ReportState(
      reportReasons: reportReasons ?? this.reportReasons,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isSuccess: isSuccess ?? this.isSuccess,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage:
          clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

// ============================================================================
// Report Notifier
// ============================================================================

class ReportNotifier extends StateNotifier<ReportState> {
  final ReportRepository _repository;

  ReportNotifier(this._repository) : super(const ReportState()) {
    loadReportReasons();
  }

  /// Load available report reasons
  Future<void> loadReportReasons({String? type}) async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.getReportReasons(type: type);

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load report reasons',
        );
      },
      (reasons) {
        state = state.copyWith(
          isLoading: false,
          reportReasons: reasons,
        );
      },
    );
  }

  /// Submit a report
  Future<bool> submitReport({
    required ReportType type,
    required String targetId,
    required ReportReason reason,
    String? description,
  }) async {
    state = state.copyWith(
      isSubmitting: true,
      isSuccess: false,
      clearError: true,
      clearSuccess: true,
    );

    final request = CreateReportRequest(
      type: type,
      targetId: targetId,
      reason: reason,
      description: description,
    );

    final result = await _repository.createReport(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSubmitting: false,
          errorMessage: failure.message ?? 'Failed to submit report',
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isSubmitting: false,
          isSuccess: true,
          successMessage: 'Report submitted successfully. We will review it shortly.',
        );
        return true;
      },
    );
  }

  /// Report a user
  Future<bool> reportUser({
    required String userId,
    required ReportReason reason,
    String? description,
  }) {
    return submitReport(
      type: ReportType.user,
      targetId: userId,
      reason: reason,
      description: description,
    );
  }

  /// Report a post
  Future<bool> reportPost({
    required String postId,
    required ReportReason reason,
    String? description,
  }) {
    return submitReport(
      type: ReportType.post,
      targetId: postId,
      reason: reason,
      description: description,
    );
  }

  /// Report a comment
  Future<bool> reportComment({
    required String commentId,
    required ReportReason reason,
    String? description,
  }) {
    return submitReport(
      type: ReportType.comment,
      targetId: commentId,
      reason: reason,
      description: description,
    );
  }

  /// Report a message
  Future<bool> reportMessage({
    required String messageId,
    required ReportReason reason,
    String? description,
  }) {
    return submitReport(
      type: ReportType.message,
      targetId: messageId,
      reason: reason,
      description: description,
    );
  }

  /// Report a competition
  Future<bool> reportCompetition({
    required String competitionId,
    required ReportReason reason,
    String? description,
  }) {
    return submitReport(
      type: ReportType.competition,
      targetId: competitionId,
      reason: reason,
      description: description,
    );
  }

  /// Reset state for new report
  void reset() {
    state = ReportState(reportReasons: state.reportReasons);
  }

  /// Clear messages
  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

// ============================================================================
// My Reports State
// ============================================================================

class MyReportsState {
  final List<ReportModel> reports;
  final bool isLoading;
  final bool hasMore;
  final String? cursor;
  final String? errorMessage;

  const MyReportsState({
    this.reports = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.cursor,
    this.errorMessage,
  });

  MyReportsState copyWith({
    List<ReportModel>? reports,
    bool? isLoading,
    bool? hasMore,
    String? cursor,
    String? errorMessage,
    bool clearError = false,
  }) {
    return MyReportsState(
      reports: reports ?? this.reports,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      cursor: cursor ?? this.cursor,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// My Reports Notifier
// ============================================================================

class MyReportsNotifier extends StateNotifier<MyReportsState> {
  final ReportRepository _repository;

  MyReportsNotifier(this._repository) : super(const MyReportsState());

  /// Load user's submitted reports
  Future<void> loadMyReports({bool refresh = false}) async {
    if (state.isLoading) return;
    if (!refresh && !state.hasMore) return;

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      reports: refresh ? [] : null,
      cursor: refresh ? null : state.cursor,
    );

    final result = await _repository.getMyReports(
      cursor: refresh ? null : state.cursor,
    );

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message ?? 'Failed to load reports',
        );
      },
      (response) {
        state = state.copyWith(
          isLoading: false,
          reports: refresh ? response.items : [...state.reports, ...response.items],
          hasMore: response.hasMore,
          cursor: response.nextCursor,
        );
      },
    );
  }

  /// Cancel a report
  Future<bool> cancelReport(String reportId) async {
    final result = await _repository.cancelReport(reportId);
    
    return result.fold(
      (failure) => false,
      (_) {
        state = state.copyWith(
          reports: state.reports.where((r) => r.id != reportId).toList(),
        );
        return true;
      },
    );
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main report provider
final reportProvider =
    StateNotifierProvider<ReportNotifier, ReportState>((ref) {
  final repository = ref.watch(reportRepositoryProvider);
  return ReportNotifier(repository);
});

/// My reports provider
final myReportsProvider =
    StateNotifierProvider<MyReportsNotifier, MyReportsState>((ref) {
  final repository = ref.watch(reportRepositoryProvider);
  return MyReportsNotifier(repository);
});

/// Report reasons provider (convenience)
final reportReasonsProvider = Provider<List<ReportReasonModel>>((ref) {
  final reportState = ref.watch(reportProvider);
  return reportState.reportReasons;
});

/// Report details provider
final reportDetailsProvider =
    FutureProvider.family<ReportModel, String>((ref, reportId) async {
  final repository = ref.watch(reportRepositoryProvider);
  final result = await repository.getReport(reportId);
  return result.fold(
    (failure) => throw Exception(failure.message),
    (report) => report,
  );
});
