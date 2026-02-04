import '../../../../core/utils/either.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/models/base_response.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../search/data/models/search_model.dart';
import '../../data/models/explore_model.dart';

/// Abstract repository for explore/discovery operations
abstract class ExploreRepository {
  // Main explore feed
  Future<Result<ExploreFeedModel>> getExploreFeed();
  
  // Discover content
  Future<Result<PaginatedResponse<PostModel>>> getDiscoverPosts({
    String? category,
    String? cursor,
    int limit = 20,
  });
  Future<Result<List<SimpleUserModel>>> getDiscoverUsers({int limit = 10});
  Future<Result<List<CompetitionModel>>> getDiscoverCompetitions({int limit = 10});
  
  // Trending content
  /// NOTE: Backend does not have /posts/trending endpoint.
  /// Implementation uses for-you feed as fallback.
  Future<Result<List<PostModel>>> getTrendingPosts({int limit = 20});
  Future<Result<List<HashtagModel>>> getTrendingHashtags({int limit = 10});
  /// NOTE: Backend does not have trending creators endpoint.
  /// Implementation uses recently joined users as fallback.
  Future<Result<List<SimpleUserModel>>> getTrendingCreators({int limit = 10});
  
  // Categories
  /// NOTE: Backend does not have categories endpoint.
  /// Implementation returns empty list.
  Future<Result<List<ExploreCategoryModel>>> getCategories();
  Future<Result<PaginatedResponse<PostModel>>> getPostsByCategory(
    String categoryId, {
    String? cursor,
    int limit = 20,
  });
  
  // Hashtag exploration
  Future<Result<HashtagDetailModel>> getHashtagDetail(String hashtag);
  Future<Result<PaginatedResponse<PostModel>>> getPostsByHashtag(
    String hashtag, {
    String? cursor,
    int limit = 20,
  });
  
  // For You / Personalized
  Future<Result<PaginatedResponse<PostModel>>> getForYouFeed({
    String? cursor,
    int limit = 20,
  });
  
  // Following feed
  Future<Result<PaginatedResponse<PostModel>>> getFollowingFeed({
    String? cursor,
    int limit = 20,
  });
  
  // Featured content
  Future<Result<List<FeaturedContentModel>>> getFeaturedContent();
  Future<Result<List<SimpleUserModel>>> getFeaturedCreators({int limit = 10});
}
