import '../../../../core/utils/either.dart';
import '../../../../core/models/base_response.dart';
import '../../../auth/data/models/user_model.dart';
import '../../../posts/data/models/post_model.dart';
import '../../data/models/search_model.dart';
import '../../data/datasources/search_api_service.dart' show RecentSearchModel, SaveRecentSearchRequest, SearchSuggestionsModel;

/// Abstract repository for search operations
abstract class SearchRepository {
  /// Global search across all content types
  Future<Result<SearchResultModel>> search(
    String query, {
    String? type,
    String? cursor,
    int limit = 20,
  });
  
  /// Search for users
  Future<Result<PaginatedResponse<SimpleUserModel>>> searchUsers(
    String query, {
    String? cursor,
    int limit = 20,
  });
  
  /// Search for posts
  Future<Result<PaginatedResponse<PostModel>>> searchPosts(
    String query, {
    String? cursor,
    int limit = 20,
  });
  
  /// Search for hashtags
  Future<Result<PaginatedResponse<HashtagModel>>> searchHashtags(
    String query, {
    String? cursor,
    int limit = 20,
  });
  
  /// Get trending hashtags
  Future<Result<TrendingHashtagsModel>> getTrendingHashtags({int limit = 10});
  
  /// Get posts by hashtag
  Future<Result<PaginatedResponse<PostModel>>> getPostsByHashtag(
    String hashtag, {
    String? cursor,
    int limit = 20,
  });
  
  /// Get recent searches (search history)
  Future<Result<List<RecentSearchModel>>> getRecentSearches({int limit = 10});
  
  /// Save a recent search
  Future<Result<void>> saveRecentSearch(SaveRecentSearchRequest request);
  
  /// Delete a recent search
  Future<Result<void>> deleteRecentSearch(String searchId);
  
  /// Clear all recent searches
  Future<Result<void>> clearRecentSearches();
  
  /// Get search suggestions as user types
  Future<Result<SearchSuggestionsModel>> getSuggestions(
    String query, {
    int limit = 5,
  });
}
