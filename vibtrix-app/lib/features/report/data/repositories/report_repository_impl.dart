import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/models/base_response.dart';
import '../../domain/repositories/report_repository.dart';
import '../datasources/report_api_service.dart' as api;
import '../datasources/report_api_service.dart' show ReportReasonModel;
import '../models/report_model.dart';

/// Implementation of ReportRepository
class ReportRepositoryImpl implements ReportRepository {
  final api.ReportApiService _apiService;

  ReportRepositoryImpl({required api.ReportApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<ReportModel>> createReport(CreateReportRequest request) async {
    try {
      // Convert model request to API request
      final apiRequest = api.CreateReportRequest(
        type: request.type.name,
        targetId: request.targetId,
        reason: request.reason.name,
        description: request.description,
      );
      final report = await _apiService.createReport(apiRequest);
      return Right(report);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<ReportModel>>> getMyReports({
    String? status,
    String? type,
    String? cursor,
    int limit = 20,
  }) async {
    try {
      final reports = await _apiService.getMyReports(
        status: status,
        type: type,
        cursor: cursor,
        limit: limit,
      );
      return Right(reports);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ReportModel>> getReport(String reportId) async {
    try {
      final report = await _apiService.getReport(reportId);
      return Right(report);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> cancelReport(String reportId) async {
    try {
      await _apiService.cancelReport(reportId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<ReportReasonModel>>> getReportReasons({String? type}) async {
    try {
      final reasons = await _apiService.getReportReasons(type: type);
      return Right(reasons);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
