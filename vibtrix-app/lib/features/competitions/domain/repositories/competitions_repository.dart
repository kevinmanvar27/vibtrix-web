import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../../posts/data/models/post_model.dart';
import '../../data/models/competition_model.dart';

/// Abstract repository for competition operations
/// Note: Many endpoints are not implemented in the backend
/// Only the following are available:
/// - GET /competitions
/// - GET /competitions/{id}
/// - POST /competitions/{id}/participate
/// - DELETE /competitions/{id}/participate
/// - GET /competitions/{id}/leaderboard
/// - GET /competitions/{id}/winners
/// - POST /competitions/{id}/submit-post
/// - GET /competitions/{id}/check-participation
abstract class CompetitionsRepository {
  // Competition retrieval
  Future<Result<CompetitionModel>> getCompetition(String competitionId);
  Future<Result<List<CompetitionModel>>> getCompetitions({
    String? status,
    String? type,
    int limit = 20,
  });
  
  // Participation
  Future<Result<ParticipantModel>> joinCompetition(String competitionId);
  Future<Result<void>> leaveCompetition(String competitionId);
  Future<Result<bool>> checkParticipation(String competitionId);
  
  // Submissions
  Future<Result<PostModel>> submitEntry(String competitionId, String postId);
  
  // Leaderboard & Results
  Future<Result<PaginatedResponse<LeaderboardEntryModel>>> getLeaderboard(
    String competitionId, {
    String? roundId,
    String? cursor,
    int limit = 50,
  });
  Future<Result<List<LeaderboardEntryModel>>> getWinners(String competitionId);
}
