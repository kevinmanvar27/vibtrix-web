import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/storage/local_storage.dart';
import '../../domain/repositories/feedback_repository.dart';
import '../datasources/feedback_api_service.dart';
import '../models/feedback_model.dart';

/// Implementation of FeedbackRepository
class FeedbackRepositoryImpl implements FeedbackRepository {
  final FeedbackApiService _apiService;
  final LocalStorageService _localStorage;

  static const String _hasRatedKey = 'has_rated_app';
  static const String _ratingDismissedKey = 'rating_dismissed';
  static const String _appOpenCountKey = 'app_open_count';

  FeedbackRepositoryImpl({
    required FeedbackApiService apiService,
    required LocalStorageService localStorage,
  })  : _apiService = apiService,
        _localStorage = localStorage;

  @override
  Future<Result<FeedbackModel>> submitFeedback(CreateFeedbackRequest request) async {
    try {
      final feedback = await _apiService.submitFeedback(request);
      return Right(feedback);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<FeedbackCategoryModel>>> getFeedbackCategories() async {
    try {
      final categories = await _apiService.getFeedbackCategories();
      return Right(categories);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<FeedbackModel>>> getMyFeedback() async {
    try {
      final feedback = await _apiService.getMyFeedback();
      return Right(feedback);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<FeedbackModel>> getFeedback(String feedbackId) async {
    try {
      final feedback = await _apiService.getFeedback(feedbackId);
      return Right(feedback);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> submitAppRating(int rating, String? review) async {
    try {
      await _apiService.submitAppRating(
        SubmitAppRatingRequest(rating: rating, review: review),
      );
      await _localStorage.setBool(_hasRatedKey, true);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> hasRatedApp() async {
    try {
      final hasRated = _localStorage.getBool(_hasRatedKey) ?? false;
      return Right(hasRated);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> dismissRatingPrompt() async {
    try {
      await _localStorage.setBool(_ratingDismissedKey, true);
      return const Right(null);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> shouldShowRatingPrompt() async {
    try {
      // Don't show if already rated
      final hasRated = _localStorage.getBool(_hasRatedKey) ?? false;
      if (hasRated) return const Right(false);

      // Don't show if dismissed
      final dismissed = _localStorage.getBool(_ratingDismissedKey) ?? false;
      if (dismissed) return const Right(false);

      // Show after 5 app opens
      final openCount = _localStorage.getInt(_appOpenCountKey) ?? 0;
      return Right(openCount >= 5);
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
