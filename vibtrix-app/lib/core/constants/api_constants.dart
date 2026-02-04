/// API Constants for VidiBattle
class ApiConstants {
  ApiConstants._();

  // Base URL - Change this for production
  // For physical device testing, use your computer's local IP address
  // Example: 'http://192.168.1.100:3000'
  // For Android emulator, use: 'http://10.0.2.2:3000'
  // For iOS simulator, use: 'http://localhost:3000'
  static const String baseUrl = 'http://10.0.2.2:3000';
  
  // API Version
  static const String apiVersion = '/api';
  
  // Full API URL
  static String get apiUrl => '$baseUrl$apiVersion';

  // Auth Endpoints
  static const String login = '/auth/token';
  static const String signup = '/auth/signup';
  static const String refreshToken = '/auth/refresh';
  static const String revokeToken = '/auth/revoke';

  // User Endpoints
  static const String currentUser = '/users/me';
  static String userProfile(String userId) => '/users/$userId';
  static String userPosts(String userId) => '/users/$userId/posts';
  static String blockUser(String userId) => '/users/$userId/block';
  static String followUser(String userId) => '/users/$userId/followers';
  static String followersList(String userId) => '/users/$userId/followers/list';
  static String followingList(String userId) => '/users/$userId/following/list';
  static String mutualFollowers(String userId) => '/users/$userId/mutual-followers';
  static String followStatus(String userId) => '/users/$userId/follow-status';
  static String followRequest(String userId) => '/users/$userId/follow-request';
  static String reportUser(String userId) => '/users/$userId/report';

  // Post Endpoints
  static const String forYouFeed = '/posts/for-you';
  static const String followingFeed = '/posts/following';
  static String post(String postId) => '/posts/$postId';
  static String editPost(String postId) => '/posts/$postId/edit';
  static String postLikes(String postId) => '/posts/$postId/likes';
  static String postComments(String postId) => '/posts/$postId/comments';
  static String deleteComment(String postId, String commentId) => '/posts/$postId/comments/$commentId';
  static String postBookmark(String postId) => '/posts/$postId/bookmark';
  static String postView(String postId) => '/posts/$postId/view';
  static String postReport(String postId) => '/posts/$postId/report';
  static String postShareLink(String postId) => '/posts/$postId/share-link';
  static String postShares(String postId) => '/posts/$postId/shares';
  static String postCompetitionInfo(String postId) => '/posts/$postId/competition-info';

  // Comment Endpoints
  static String reportComment(String commentId) => '/comments/$commentId/report';

  // Competition Endpoints
  static const String competitions = '/competitions';
  static String competition(String competitionId) => '/competitions/$competitionId';
  static String participateCompetition(String competitionId) => '/competitions/$competitionId/participate';
  static String competitionParticipants(String competitionId) => '/competitions/$competitionId/participants';
  static String competitionRounds(String competitionId) => '/competitions/$competitionId/rounds';
  static String competitionLeaderboard(String competitionId) => '/competitions/$competitionId/leaderboard';

  // Search & Hashtags
  static const String search = '/search';
  static const String trendingHashtags = '/hashtags/trending';

  // Notifications
  static const String notifications = '/notifications';
  static const String markNotificationsRead = '/notifications/mark-as-read';
  static const String unreadNotificationCount = '/notifications/unread-count';
  static const String notificationDevices = '/notifications/devices';

  // Chat & Messages
  static const String chats = '/chats';
  static String chat(String chatId) => '/chats/$chatId';
  static String chatMessages(String chatId) => '/chats/$chatId/messages';
  static const String sendMessage = '/messages';
  static const String unreadMessageCount = '/messages/unread-count';

  // Payments
  static const String createPaymentOrder = '/payments/create-order';
  static const String verifyPayment = '/payments/verify';

  // Upload
  static const String upload = '/upload';

  // Settings & Config
  static const String settings = '/settings';
  static const String feedStickersSettings = '/settings/feed-stickers';
  static const String appConfig = '/app/config';

  // Feedback
  static const String feedback = '/feedback';

  // Advertisements
  static const String advertisements = '/advertisements';

  // Public Endpoints
  static const String publicFeedStickers = '/public/feed-stickers';
  static String publicCompetitionStickers(String competitionId) => '/public/competitions/$competitionId/feed-stickers';

  // Health
  static const String health = '/health';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 60);
}
