import '../../../../core/utils/either.dart';
import '../../../../core/models/base_response.dart';
import '../../data/models/report_model.dart';
import '../../data/datasources/report_api_service.dart' show ReportReasonModel;

/// Abstract repository for report operations
abstract class ReportRepository {
  // Create a report
  Future<Result<ReportModel>> createReport(CreateReportRequest request);
  
  // Get user's reports
  Future<Result<PaginatedResponse<ReportModel>>> getMyReports({
    String? status,
    String? type,
    String? cursor,
    int limit = 20,
  });
  
  // Get report details
  Future<Result<ReportModel>> getReport(String reportId);
  
  // Cancel a pending report
  Future<Result<void>> cancelReport(String reportId);
  
  // Get report reasons
  Future<Result<List<ReportReasonModel>>> getReportReasons({String? type});
}
