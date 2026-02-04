import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../../../../core/models/base_response.dart';
import '../../../posts/data/models/post_model.dart';
import '../models/competition_model.dart';

part 'competitions_api_service.g.dart';

@RestApi()
abstract class CompetitionsApiService {
  factory CompetitionsApiService(Dio dio, {String baseUrl}) = _CompetitionsApiService;

  // Backend returns a direct array, not paginated response
  @GET('/competitions')
  Future<List<CompetitionModel>> getCompetitions({
    @Query('status') String? status,
    @Query('type') String? type,
    @Query('limit') int limit = 20,
  });

  @GET('/competitions/{competitionId}')
  Future<CompetitionModel> getCompetition(@Path('competitionId') String competitionId);

  @POST('/competitions/{competitionId}/participate')
  Future<ParticipantModel> joinCompetition(@Path('competitionId') String competitionId);

  @DELETE('/competitions/{competitionId}/participate')
  Future<void> leaveCompetition(@Path('competitionId') String competitionId);

  @GET('/competitions/{competitionId}/leaderboard')
  Future<PaginatedResponse<LeaderboardEntryModel>> getLeaderboard(
    @Path('competitionId') String competitionId, {
    @Query('roundId') String? roundId,
    @Query('cursor') String? cursor,
    @Query('limit') int limit = 50,
  });

  @GET('/competitions/{competitionId}/winners')
  Future<List<LeaderboardEntryModel>> getWinners(
    @Path('competitionId') String competitionId,
  );

  // Note: Backend uses /submit-post with body {postId}, not /entries/{postId}
  @POST('/competitions/{competitionId}/submit-post')
  Future<PostModel> submitEntry(
    @Path('competitionId') String competitionId,
    @Body() Map<String, String> body,
  );

  // Check if user is participating
  @GET('/competitions/{competitionId}/check-participation')
  Future<Map<String, dynamic>> checkParticipation(@Path('competitionId') String competitionId);
}
