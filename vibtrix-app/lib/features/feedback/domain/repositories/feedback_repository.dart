import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../data/models/feedback_model.dart';

/// Abstract repository for feedback operations
abstract class FeedbackRepository {
  // Submit feedback
  Future<Result<FeedbackModel>> submitFeedback(CreateFeedbackRequest request);
  
  // Get feedback categories
  Future<Result<List<FeedbackCategoryModel>>> getFeedbackCategories();
  
  // User's feedback history
  Future<Result<List<FeedbackModel>>> getMyFeedback();
  Future<Result<FeedbackModel>> getFeedback(String feedbackId);
  
  // App rating
  Future<Result<void>> submitAppRating(int rating, String? review);
  Future<Result<bool>> hasRatedApp();
  Future<Result<void>> dismissRatingPrompt();
  Future<Result<bool>> shouldShowRatingPrompt();
}
