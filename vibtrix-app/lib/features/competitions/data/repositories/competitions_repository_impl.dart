import 'package:dio/dio.dart';
import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/network/error_handler.dart';
import '../../../../core/models/base_response.dart';
import '../../../posts/data/models/post_model.dart';
import '../../domain/repositories/competitions_repository.dart';
import '../datasources/competitions_api_service.dart';
import '../models/competition_model.dart';

/// Implementation of CompetitionsRepository
/// Note: Many endpoints are not implemented in the backend
class CompetitionsRepositoryImpl implements CompetitionsRepository {
  final CompetitionsApiService _apiService;

  CompetitionsRepositoryImpl({required CompetitionsApiService apiService})
      : _apiService = apiService;

  @override
  Future<Result<CompetitionModel>> getCompetition(String competitionId) async {
    try {
      final competition = await _apiService.getCompetition(competitionId);
      return Right(competition);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<CompetitionModel>>> getCompetitions({
    String? status,
    String? type,
    int limit = 20,
  }) async {
    try {
      final competitions = await _apiService.getCompetitions(
        status: status,
        type: type,
        limit: limit,
      );
      return Right(competitions);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<ParticipantModel>> joinCompetition(String competitionId) async {
    try {
      final participant = await _apiService.joinCompetition(competitionId);
      return Right(participant);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<void>> leaveCompetition(String competitionId) async {
    try {
      await _apiService.leaveCompetition(competitionId);
      return const Right(null);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<bool>> checkParticipation(String competitionId) async {
    try {
      final response = await _apiService.checkParticipation(competitionId);
      final isParticipating = response['isParticipating'] as bool? ?? false;
      return Right(isParticipating);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PostModel>> submitEntry(String competitionId, String postId) async {
    try {
      final entry = await _apiService.submitEntry(competitionId, {'postId': postId});
      return Right(entry);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<PaginatedResponse<LeaderboardEntryModel>>> getLeaderboard(
    String competitionId, {
    String? roundId,
    String? cursor,
    int limit = 50,
  }) async {
    try {
      final response = await _apiService.getLeaderboard(
        competitionId,
        roundId: roundId,
        cursor: cursor,
        limit: limit,
      );
      return Right(response);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }

  @override
  Future<Result<List<LeaderboardEntryModel>>> getWinners(String competitionId) async {
    try {
      final winners = await _apiService.getWinners(competitionId);
      return Right(winners);
    } on DioException catch (e) {
      return Left(NetworkErrorHandler.handleDioError(e));
    } catch (e) {
      return Left(NetworkErrorHandler.handleException(e));
    }
  }
}
