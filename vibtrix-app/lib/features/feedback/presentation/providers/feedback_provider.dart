/// Feedback state management using Riverpod
/// Handles app feedback, feature requests, and bug reports

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../data/models/feedback_model.dart';
import '../../domain/repositories/feedback_repository.dart';

// ============================================================================
// Feedback State
// ============================================================================

class FeedbackState {
  final List<FeedbackCategoryModel> categories;
  final bool isLoading;
  final bool isSubmitting;
  final bool isSuccess;
  final String? errorMessage;
  final String? successMessage;

  const FeedbackState({
    this.categories = const [],
    this.isLoading = false,
    this.isSubmitting = false,
    this.isSuccess = false,
    this.errorMessage,
    this.successMessage,
  });

  FeedbackState copyWith({
    List<FeedbackCategoryModel>? categories,
    bool? isLoading,
    bool? isSubmitting,
    bool? isSuccess,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return FeedbackState(
      categories: categories ?? this.categories,
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
// Feedback Notifier
// ============================================================================

class FeedbackNotifier extends StateNotifier<FeedbackState> {
  final FeedbackRepository _repository;

  FeedbackNotifier(this._repository) : super(const FeedbackState()) {
    loadCategories();
  }

  /// Load feedback categories
  Future<void> loadCategories() async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.getFeedbackCategories();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (categories) {
        state = state.copyWith(
          isLoading: false,
          categories: categories,
        );
      },
    );
  }

  /// Submit general feedback
  Future<bool> submitFeedback({
    required FeedbackType type,
    required String subject,
    required String message,
    int? rating,
    List<String>? attachments,
  }) async {
    state = state.copyWith(
      isSubmitting: true,
      isSuccess: false,
      clearError: true,
      clearSuccess: true,
    );

    final request = CreateFeedbackRequest(
      type: type,
      subject: subject,
      message: message,
      rating: rating,
      attachments: attachments,
    );

    final result = await _repository.submitFeedback(request);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSubmitting: false,
          errorMessage: failure.message,
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isSubmitting: false,
          isSuccess: true,
          successMessage: 'Thank you for your feedback!',
        );
        return true;
      },
    );
  }

  /// Submit bug report
  Future<bool> submitBugReport({
    required String subject,
    required String description,
    List<String>? attachments,
  }) async {
    return submitFeedback(
      type: FeedbackType.bug,
      subject: subject,
      message: description,
      attachments: attachments,
    );
  }

  /// Submit feature request
  Future<bool> submitFeatureRequest({
    required String subject,
    required String description,
  }) async {
    return submitFeedback(
      type: FeedbackType.feature,
      subject: subject,
      message: description,
    );
  }

  /// Submit app rating
  Future<bool> submitAppRating({
    required int rating,
    String? review,
  }) async {
    state = state.copyWith(
      isSubmitting: true,
      isSuccess: false,
      clearError: true,
      clearSuccess: true,
    );

    final result = await _repository.submitAppRating(rating, review);

    return result.fold(
      (failure) {
        state = state.copyWith(
          isSubmitting: false,
          errorMessage: failure.message,
        );
        return false;
      },
      (_) {
        state = state.copyWith(
          isSubmitting: false,
          isSuccess: true,
          successMessage: 'Thank you for rating VidiBattle!',
        );
        return true;
      },
    );
  }

  /// Reset state for new feedback
  void reset() {
    state = FeedbackState(categories: state.categories);
  }

  /// Clear messages
  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }
}

// ============================================================================
// My Feedback State
// ============================================================================

class MyFeedbackState {
  final List<FeedbackModel> feedbackList;
  final bool isLoading;
  final String? errorMessage;

  const MyFeedbackState({
    this.feedbackList = const [],
    this.isLoading = false,
    this.errorMessage,
  });

  MyFeedbackState copyWith({
    List<FeedbackModel>? feedbackList,
    bool? isLoading,
    String? errorMessage,
    bool clearError = false,
  }) {
    return MyFeedbackState(
      feedbackList: feedbackList ?? this.feedbackList,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

// ============================================================================
// My Feedback Notifier
// ============================================================================

class MyFeedbackNotifier extends StateNotifier<MyFeedbackState> {
  final FeedbackRepository _repository;

  MyFeedbackNotifier(this._repository) : super(const MyFeedbackState());

  /// Load user's submitted feedback
  Future<void> loadMyFeedback() async {
    state = state.copyWith(isLoading: true, clearError: true);

    final result = await _repository.getMyFeedback();

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: failure.message,
        );
      },
      (feedbackList) {
        state = state.copyWith(
          isLoading: false,
          feedbackList: feedbackList,
        );
      },
    );
  }
}

// ============================================================================
// Providers
// ============================================================================

/// Main feedback provider
final feedbackProvider =
    StateNotifierProvider<FeedbackNotifier, FeedbackState>((ref) {
  final repository = ref.watch(feedbackRepositoryProvider);
  return FeedbackNotifier(repository);
});

/// My feedback provider
final myFeedbackProvider =
    StateNotifierProvider<MyFeedbackNotifier, MyFeedbackState>((ref) {
  final repository = ref.watch(feedbackRepositoryProvider);
  return MyFeedbackNotifier(repository);
});

/// Feedback categories provider (convenience)
final feedbackCategoriesProvider = Provider<List<FeedbackCategoryModel>>((ref) {
  final feedbackState = ref.watch(feedbackProvider);
  return feedbackState.categories;
});

/// Feedback detail provider
final feedbackDetailProvider =
    FutureProvider.family<FeedbackModel, String>((ref, feedbackId) async {
  final repository = ref.watch(feedbackRepositoryProvider);
  final result = await repository.getFeedback(feedbackId);
  return result.fold(
    (failure) => throw Exception(failure.message),
    (feedback) => feedback,
  );
});

/// Should show rating prompt provider
final shouldShowRatingPromptProvider = FutureProvider<bool>((ref) async {
  final repository = ref.watch(feedbackRepositoryProvider);
  final result = await repository.shouldShowRatingPrompt();
  return result.fold(
    (failure) => false,
    (shouldShow) => shouldShow,
  );
});

/// Has rated app provider
final hasRatedAppProvider = FutureProvider<bool>((ref) async {
  final repository = ref.watch(feedbackRepositoryProvider);
  final result = await repository.hasRatedApp();
  return result.fold(
    (failure) => false,
    (hasRated) => hasRated,
  );
});
