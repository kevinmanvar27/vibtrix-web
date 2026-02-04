/// Route names for the application
/// 
/// All route paths are defined here as constants for type safety
/// and easy refactoring
abstract class RouteNames {
  // ============================================
  // SPLASH & ONBOARDING
  // ============================================
  static const String splash = '/splash';
  static const String onboarding = '/onboarding';
  
  // ============================================
  // AUTHENTICATION
  // ============================================
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';
  static const String verifyOtp = '/verify-otp';
  
  // ============================================
  // MAIN NAVIGATION (Shell Routes)
  // ============================================
  static const String home = '/';
  static const String feed = '/feed';
  static const String explore = '/explore';
  static const String competitions = '/competitions';
  static const String chat = '/chat';
  static const String profile = '/profile';
  
  // ============================================
  // POST ROUTES
  // ============================================
  static const String createPost = '/post/create';
  static const String postDetail = '/post/:postId';
  static const String postComments = '/post/:postId/comments';
  static const String postLikes = '/post/:postId/likes';
  
  // ============================================
  // USER ROUTES
  // ============================================
  static const String userProfile = '/user/:userId';
  static const String userFollowers = '/user/:userId/followers';
  static const String userFollowing = '/user/:userId/following';
  static const String editProfile = '/profile/edit';
  
  // ============================================
  // COMPETITION ROUTES
  // ============================================
  static const String competitionDetail = '/competition/:competitionId';
  static const String competitionParticipants = '/competition/:competitionId/participants';
  static const String competitionLeaderboard = '/competition/:competitionId/leaderboard';
  static const String createCompetition = '/competition/create';
  static const String joinCompetition = '/competition/:competitionId/join';
  
  // ============================================
  // CHAT ROUTES
  // ============================================
  static const String chatRoom = '/chat/:chatId';
  static const String newChat = '/chat/new';
  
  // ============================================
  // NOTIFICATION ROUTES
  // ============================================
  static const String notifications = '/notifications';
  
  // ============================================
  // SEARCH ROUTES
  // ============================================
  static const String search = '/search';
  static const String searchResults = '/search/results';
  
  // ============================================
  // SETTINGS ROUTES
  // ============================================
  static const String settings = '/settings';
  static const String settingsAccount = '/settings/account';
  static const String settingsPrivacy = '/settings/privacy';
  static const String settingsNotifications = '/settings/notifications';
  static const String settingsAppearance = '/settings/appearance';
  static const String settingsAbout = '/settings/about';
  static const String settingsHelp = '/settings/help';
  static const String settingsBlocked = '/settings/blocked';
  
  // ============================================
  // WALLET & PAYMENTS
  // ============================================
  static const String wallet = '/wallet';
  static const String walletTransactions = '/wallet/transactions';
  static const String walletWithdraw = '/wallet/withdraw';
  static const String walletAddMoney = '/wallet/add';
  
  // ============================================
  // REPORT & FEEDBACK
  // ============================================
  static const String reportUser = '/report/user/:userId';
  static const String reportPost = '/report/post/:postId';
  static const String reportComment = '/report/comment/:commentId';
  static const String feedback = '/feedback';
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  /// Generate post detail route
  static String postDetailPath(String postId) => '/post/$postId';
  
  /// Generate post comments route
  static String postCommentsPath(String postId) => '/post/$postId/comments';
  
  /// Generate post likes route
  static String postLikesPath(String postId) => '/post/$postId/likes';
  
  /// Generate user profile route
  static String userProfilePath(String userId) => '/user/$userId';
  
  /// Generate user followers route
  static String userFollowersPath(String userId) => '/user/$userId/followers';
  
  /// Generate user following route
  static String userFollowingPath(String userId) => '/user/$userId/following';
  
  /// Generate competition detail route
  static String competitionDetailPath(String competitionId) => '/competition/$competitionId';
  
  /// Generate competition participants route
  static String competitionParticipantsPath(String competitionId) => '/competition/$competitionId/participants';
  
  /// Generate competition leaderboard route
  static String competitionLeaderboardPath(String competitionId) => '/competition/$competitionId/leaderboard';
  
  /// Generate join competition route
  static String joinCompetitionPath(String competitionId) => '/competition/$competitionId/join';
  
  /// Generate chat room route
  static String chatRoomPath(String chatId) => '/chat/$chatId';
  
  /// Generate report user route
  static String reportUserPath(String userId) => '/report/user/$userId';
  
  /// Generate report post route
  static String reportPostPath(String postId) => '/report/post/$postId';
  
  /// Generate report comment route
  static String reportCommentPath(String commentId) => '/report/comment/$commentId';
}
