import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import '../models/feedback_model.dart';

part 'feedback_api_service.g.dart';

@RestApi()
abstract class FeedbackApiService {
  factory FeedbackApiService(Dio dio, {String baseUrl}) = _FeedbackApiService;

  // Submit feedback
  @POST('/feedback')
  Future<FeedbackModel> submitFeedback(@Body() CreateFeedbackRequest request);

  // Submit feedback with attachments
  @MultiPart()
  @POST('/feedback/with-attachments')
  Future<FeedbackModel> submitFeedbackWithAttachments(
    @Part(name: 'type') String type,
    @Part(name: 'subject') String subject,
    @Part(name: 'message') String message,
    @Part(name: 'email') String? email,
    @Part(name: 'attachments') List<List<int>> attachments,
    @Part(name: 'attachmentNames') List<String> attachmentNames,
  );

  // Get feedback categories
  @GET('/feedback/categories')
  Future<List<FeedbackCategoryModel>> getFeedbackCategories();

  // Get user's feedback history
  @GET('/feedback')
  Future<List<FeedbackModel>> getMyFeedback({
    @Query('status') String? status,
    @Query('type') String? type,
  });

  // Get feedback details
  @GET('/feedback/{feedbackId}')
  Future<FeedbackModel> getFeedback(@Path('feedbackId') String feedbackId);

  // Add reply to feedback (for follow-up)
  @POST('/feedback/{feedbackId}/reply')
  Future<FeedbackReplyModel> addReply(
    @Path('feedbackId') String feedbackId,
    @Body() AddFeedbackReplyRequest request,
  );

  // Submit app rating
  @POST('/feedback/app-rating')
  Future<void> submitAppRating(@Body() SubmitAppRatingRequest request);
}

// Request models
@JsonSerializable()
class AddFeedbackReplyRequest {
  final String message;

  AddFeedbackReplyRequest({required this.message});

  factory AddFeedbackReplyRequest.fromJson(Map<String, dynamic> json) =>
      _$AddFeedbackReplyRequestFromJson(json);
  Map<String, dynamic> toJson() => _$AddFeedbackReplyRequestToJson(this);
}

@JsonSerializable()
class SubmitAppRatingRequest {
  final int rating;
  final String? review;

  SubmitAppRatingRequest({required this.rating, this.review});

  factory SubmitAppRatingRequest.fromJson(Map<String, dynamic> json) =>
      _$SubmitAppRatingRequestFromJson(json);
  Map<String, dynamic> toJson() => _$SubmitAppRatingRequestToJson(this);
}

@JsonSerializable()
class FeedbackReplyModel {
  final String id;
  final String feedbackId;
  final String message;
  final bool isFromSupport;
  final String? supportAgentName;
  final DateTime createdAt;

  FeedbackReplyModel({
    required this.id,
    required this.feedbackId,
    required this.message,
    required this.isFromSupport,
    this.supportAgentName,
    required this.createdAt,
  });

  factory FeedbackReplyModel.fromJson(Map<String, dynamic> json) =>
      _$FeedbackReplyModelFromJson(json);
  Map<String, dynamic> toJson() => _$FeedbackReplyModelToJson(this);
}
