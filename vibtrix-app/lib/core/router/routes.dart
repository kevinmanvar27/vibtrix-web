import 'package:go_router/go_router.dart';

// Auth pages
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/reset_password_page.dart';
import '../../features/auth/presentation/pages/verify_otp_page.dart';

// Chat pages
import '../../features/chat/presentation/pages/chat_list_page.dart';
import '../../features/chat/presentation/pages/chat_room_page.dart';
import '../../features/chat/presentation/pages/new_chat_page.dart';

// Competition pages
import '../../features/competitions/presentation/pages/competition_detail_page.dart';
import '../../features/competitions/presentation/pages/competitions_page.dart';
import '../../features/competitions/presentation/pages/create_competition_page.dart';
import '../../features/competitions/presentation/pages/join_competition_page.dart';
import '../../features/competitions/presentation/pages/leaderboard_page.dart';
import '../../features/competitions/presentation/pages/participants_page.dart';

// Explore pages
import '../../features/explore/presentation/pages/explore_page.dart';

// Feed pages
import '../../features/feed/presentation/pages/feed_page.dart';

// Reels pages
import '../../features/reels/presentation/pages/reels_page.dart';

// Feedback pages
import '../../features/feedback/presentation/pages/feedback_page.dart';

// Notification pages
import '../../features/notifications/presentation/pages/notifications_page.dart';

// Onboarding pages
import '../../features/onboarding/presentation/pages/onboarding_page.dart';

// Post pages
import '../../features/posts/presentation/pages/comments_page.dart';
import '../../features/posts/presentation/pages/create_post_page.dart';
import '../../features/posts/presentation/pages/likes_page.dart';
import '../../features/posts/presentation/pages/post_detail_page.dart';

// Report pages
import '../../features/report/presentation/pages/report_comment_page.dart';
import '../../features/report/presentation/pages/report_post_page.dart';
import '../../features/report/presentation/pages/report_user_page.dart';

// Search pages
import '../../features/search/presentation/pages/search_page.dart';
import '../../features/search/presentation/pages/search_results_page.dart';

// Settings pages
import '../../features/settings/presentation/pages/about_page.dart';
import '../../features/settings/presentation/pages/account_settings_page.dart';
import '../../features/settings/presentation/pages/appearance_settings_page.dart';
import '../../features/settings/presentation/pages/blocked_users_page.dart';
import '../../features/settings/presentation/pages/help_page.dart';
import '../../features/settings/presentation/pages/notification_settings_page.dart';
import '../../features/settings/presentation/pages/privacy_settings_page.dart';
import '../../features/settings/presentation/pages/settings_page.dart' hide BlockedUsersPage;

// Splash pages
import '../../features/splash/presentation/pages/splash_page.dart';

// User pages
import '../../features/users/presentation/pages/edit_profile_page.dart';
import '../../features/users/presentation/pages/followers_page.dart';
import '../../features/users/presentation/pages/following_page.dart';
import '../../features/users/presentation/pages/profile_page.dart';

// Wallet pages
import '../../features/wallet/presentation/pages/add_money_page.dart';
import '../../features/wallet/presentation/pages/transactions_page.dart';
import '../../features/wallet/presentation/pages/wallet_page.dart';
import '../../features/wallet/presentation/pages/withdraw_page.dart';

// Core widgets
import '../widgets/main_scaffold.dart';
import 'app_router.dart';
import 'route_names.dart';

/// Application routes configuration
final List<RouteBase> appRoutes = [
  // ============================================
  // SPLASH & ONBOARDING
  // ============================================
  GoRoute(
    path: RouteNames.splash,
    name: 'splash',
    builder: (context, state) => const SplashPage(),
  ),
  GoRoute(
    path: RouteNames.onboarding,
    name: 'onboarding',
    builder: (context, state) => const OnboardingPage(),
  ),
  
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.login,
    name: 'login',
    builder: (context, state) => const LoginPage(),
  ),
  GoRoute(
    path: RouteNames.register,
    name: 'register',
    builder: (context, state) => const RegisterPage(),
  ),
  GoRoute(
    path: RouteNames.forgotPassword,
    name: 'forgotPassword',
    builder: (context, state) => const ForgotPasswordPage(),
  ),
  GoRoute(
    path: RouteNames.resetPassword,
    name: 'resetPassword',
    builder: (context, state) {
      final token = state.uri.queryParameters['token'];
      return ResetPasswordPage(token: token);
    },
  ),
  GoRoute(
    path: RouteNames.verifyOtp,
    name: 'verifyOtp',
    builder: (context, state) {
      final email = state.uri.queryParameters['email'];
      final type = state.uri.queryParameters['type'] ?? 'verification';
      return VerifyOtpPage(email: email, type: type);
    },
  ),
  
  // ============================================
  // HOME REDIRECT
  // ============================================
  GoRoute(
    path: RouteNames.home,
    name: 'home',
    redirect: (context, state) => RouteNames.feed,
  ),
  
  // ============================================
  // MAIN APP SHELL (WITH BOTTOM NAVIGATION)
  // ============================================
  ShellRoute(
    navigatorKey: shellNavigatorKey,
    builder: (context, state, child) => MainScaffold(child: child),
    routes: [
      // Feed Tab
      GoRoute(
        path: RouteNames.feed,
        name: 'feed',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: FeedPage(),
        ),
      ),
      
      // Explore Tab
      GoRoute(
        path: RouteNames.explore,
        name: 'explore',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: ExplorePage(),
        ),
      ),
      
      // Competitions Tab
      GoRoute(
        path: RouteNames.competitions,
        name: 'competitions',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: CompetitionsPage(),
        ),
      ),
      
      // Chat Tab
      GoRoute(
        path: RouteNames.chat,
        name: 'chat',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: ChatListPage(),
        ),
      ),
      
      // Profile Tab (own profile)
      GoRoute(
        path: RouteNames.profile,
        name: 'profile',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: ProfilePage(),
        ),
      ),
    ],
  ),
  
  // ============================================
  // POST ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.createPost,
    name: 'createPost',
    builder: (context, state) => const CreatePostPage(),
  ),
  // Reels route - full screen vertical video feed
  GoRoute(
    path: RouteNames.reels,
    name: 'reels',
    builder: (context, state) => const ReelsPage(),
  ),
  GoRoute(
    path: RouteNames.reelsWithPost,
    name: 'reelsWithPost',
    builder: (context, state) {
      final postId = state.pathParameters['postId'];
      return ReelsPage(initialPostId: postId);
    },
  ),
  GoRoute(
    path: RouteNames.postDetail,
    name: 'postDetail',
    builder: (context, state) {
      final postId = state.pathParameters['postId']!;
      return PostDetailPage(postId: postId);
    },
    routes: [
      GoRoute(
        path: 'comments',
        name: 'postComments',
        builder: (context, state) {
          final postId = state.pathParameters['postId']!;
          return CommentsPage(postId: postId);
        },
      ),
      GoRoute(
        path: 'likes',
        name: 'postLikes',
        builder: (context, state) {
          final postId = state.pathParameters['postId']!;
          return LikesPage(postId: postId);
        },
      ),
    ],
  ),
  
  // ============================================
  // USER ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.userProfile,
    name: 'userProfile',
    builder: (context, state) {
      final userId = state.pathParameters['userId']!;
      return ProfilePage(userId: userId);
    },
    routes: [
      GoRoute(
        path: 'followers',
        name: 'userFollowers',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return FollowersPage(userId: userId);
        },
      ),
      GoRoute(
        path: 'following',
        name: 'userFollowing',
        builder: (context, state) {
          final userId = state.pathParameters['userId']!;
          return FollowingPage(userId: userId);
        },
      ),
    ],
  ),
  GoRoute(
    path: RouteNames.editProfile,
    name: 'editProfile',
    builder: (context, state) => const EditProfilePage(),
  ),
  
  // ============================================
  // COMPETITION ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.competitionDetail,
    name: 'competitionDetail',
    builder: (context, state) {
      final competitionId = state.pathParameters['competitionId']!;
      return CompetitionDetailPage(competitionId: competitionId);
    },
    routes: [
      GoRoute(
        path: 'participants',
        name: 'competitionParticipants',
        builder: (context, state) {
          final competitionId = state.pathParameters['competitionId']!;
          return ParticipantsPage(competitionId: competitionId);
        },
      ),
      GoRoute(
        path: 'leaderboard',
        name: 'competitionLeaderboard',
        builder: (context, state) {
          final competitionId = state.pathParameters['competitionId']!;
          return LeaderboardPage(competitionId: competitionId);
        },
      ),
      GoRoute(
        path: 'join',
        name: 'joinCompetition',
        builder: (context, state) {
          final competitionId = state.pathParameters['competitionId']!;
          return JoinCompetitionPage(competitionId: competitionId);
        },
      ),
    ],
  ),
  GoRoute(
    path: RouteNames.createCompetition,
    name: 'createCompetition',
    builder: (context, state) => const CreateCompetitionPage(),
  ),
  
  // ============================================
  // CHAT ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.chatRoom,
    name: 'chatRoom',
    builder: (context, state) {
      final chatId = state.pathParameters['chatId']!;
      return ChatRoomPage(chatId: chatId);
    },
  ),
  GoRoute(
    path: RouteNames.newChat,
    name: 'newChat',
    builder: (context, state) => const NewChatPage(),
  ),
  
  // ============================================
  // SEARCH ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.search,
    name: 'search',
    builder: (context, state) => const SearchPage(),
  ),
  GoRoute(
    path: RouteNames.searchResults,
    name: 'searchResults',
    builder: (context, state) {
      final query = state.uri.queryParameters['q'] ?? '';
      return SearchResultsPage(query: query);
    },
  ),
  
  // ============================================
  // NOTIFICATION ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.notifications,
    name: 'notifications',
    builder: (context, state) => const NotificationsPage(),
  ),
  
  // ============================================
  // WALLET ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.wallet,
    name: 'wallet',
    builder: (context, state) => const WalletPage(),
    routes: [
      GoRoute(
        path: 'transactions',
        name: 'walletTransactions',
        builder: (context, state) => const TransactionsPage(),
      ),
      GoRoute(
        path: 'withdraw',
        name: 'walletWithdraw',
        builder: (context, state) => const WithdrawPage(),
      ),
      GoRoute(
        path: 'add-money',
        name: 'walletAddMoney',
        builder: (context, state) => const AddMoneyPage(),
      ),
    ],
  ),
  
  // ============================================
  // SETTINGS ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.settings,
    name: 'settings',
    builder: (context, state) => const SettingsPage(),
    routes: [
      GoRoute(
        path: 'account',
        name: 'settingsAccount',
        builder: (context, state) => const AccountSettingsPage(),
      ),
      GoRoute(
        path: 'privacy',
        name: 'settingsPrivacy',
        builder: (context, state) => const PrivacySettingsPage(),
      ),
      GoRoute(
        path: 'notifications',
        name: 'settingsNotifications',
        builder: (context, state) => const NotificationSettingsPage(),
      ),
      GoRoute(
        path: 'appearance',
        name: 'settingsAppearance',
        builder: (context, state) => const AppearanceSettingsPage(),
      ),
      GoRoute(
        path: 'blocked',
        name: 'settingsBlocked',
        builder: (context, state) => const BlockedUsersPage(),
      ),
      GoRoute(
        path: 'help',
        name: 'settingsHelp',
        builder: (context, state) => const HelpPage(),
      ),
      GoRoute(
        path: 'about',
        name: 'settingsAbout',
        builder: (context, state) => const AboutPage(),
      ),
    ],
  ),
  
  // ============================================
  // REPORT ROUTES
  // ============================================
  GoRoute(
    path: RouteNames.reportUser,
    name: 'reportUser',
    builder: (context, state) {
      final userId = state.pathParameters['userId']!;
      return ReportUserPage(userId: userId);
    },
  ),
  GoRoute(
    path: RouteNames.reportPost,
    name: 'reportPost',
    builder: (context, state) {
      final postId = state.pathParameters['postId']!;
      return ReportPostPage(postId: postId);
    },
  ),
  GoRoute(
    path: RouteNames.reportComment,
    name: 'reportComment',
    builder: (context, state) {
      final commentId = state.pathParameters['commentId']!;
      return ReportCommentPage(commentId: commentId);
    },
  ),
  
  // ============================================
  // FEEDBACK ROUTE
  // ============================================
  GoRoute(
    path: RouteNames.feedback,
    name: 'feedback',
    builder: (context, state) => const FeedbackPage(),
  ),
];
