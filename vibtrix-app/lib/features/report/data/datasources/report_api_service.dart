import 'package:dio/dio.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../models/report_model.dart';

part 'report_api_service.g.dart';

@RestApi()
abstract class ReportApiService {
  factory ReportApiService(Dio dio, {String baseUrl}) = _ReportApiService;

  // Create a report
  @POST('/reports')
  Future<ReportModel> createReport(@Body() CreateReportRequest request);

  // Get user's submitted reports
  @GET('/reports')
  Future<PaginatedResponse<ReportModel>> getMyReports({
    @Query('status') String? status,
    @Query('type') String? type,
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 20,
  });

  // Get report details
  @GET('/reports/{reportId}')
  Future<ReportModel> getReport(@Path('reportId') String reportId);

  // Cancel a pending report
  @DELETE('/reports/{reportId}')
  Future<void> cancelReport(@Path('reportId') String reportId);

  // Report reasons (for UI dropdown)
  @GET('/reports/reasons')
  Future<List<ReportReasonModel>> getReportReasons({
    @Query('type') String? type, // Filter by report type
  });
}

// Request models
@JsonSerializable()
class CreateReportRequest {
  final String type; // 'post', 'user', 'comment', 'chat', 'message'
  final String targetId;
  final String reason;
  final String? description;
  final List<String>? evidenceUrls;

  CreateReportRequest({
    required this.type,
    required this.targetId,
    required this.reason,
    this.description,
    this.evidenceUrls,
  });

  factory CreateReportRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateReportRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateReportRequestToJson(this);
}

@JsonSerializable()
class ReportReasonModel {
  final String id;
  final String code;
  final String label;
  final String? description;
  final List<String> applicableTypes; // Which report types this reason applies to
  final int order;

  ReportReasonModel({
    required this.id,
    required this.code,
    required this.label,
    this.description,
    required this.applicableTypes,
    required this.order,
  });

  factory ReportReasonModel.fromJson(Map<String, dynamic> json) =>
      _$ReportReasonModelFromJson(json);
  Map<String, dynamic> toJson() => _$ReportReasonModelToJson(this);
}
