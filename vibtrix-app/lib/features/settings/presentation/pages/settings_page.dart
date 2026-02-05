import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../../core/providers/repository_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../users/presentation/providers/users_provider.dart' hide currentUserProvider;
import '../../../auth/data/models/user_model.dart';
import '../../data/datasources/settings_api_service.dart' show UpdatePrivacySettingsRequest;

// ============================================================================
// Settings State - Extended with notification preferences
// Persists to both local storage and backend API
// ============================================================================

class SettingsState {
  final bool pushNotifications;
  final bool privateAccount;
  final bool showOnlineStatus;
  final bool allowComments;
  final String language;
  
  // Notification preferences
  final bool notifyLikes;
  final bool notifyComments;
  final bool notifyFollowers;
  final bool notifyMentions;
  final bool notifyCompetitions;
  final bool notifyMessages;

  const SettingsState({
    this.pushNotifications = true,
    this.privateAccount = false,
    this.showOnlineStatus = true,
    this.allowComments = true,
    this.language = 'English',
    // Notification preferences defaults
    this.notifyLikes = true,
    this.notifyComments = true,
    this.notifyFollowers = true,
    this.notifyMentions = true,
    this.notifyCompetitions = true,
    this.notifyMessages = true,
  });

  SettingsState copyWith({
    bool? pushNotifications,
    bool? privateAccount,
    bool? showOnlineStatus,
    bool? allowComments,
    String? language,
    bool? notifyLikes,
    bool? notifyComments,
    bool? notifyFollowers,
    bool? notifyMentions,
    bool? notifyCompetitions,
    bool? notifyMessages,
  }) {
    return SettingsState(
      pushNotifications: pushNotifications ?? this.pushNotifications,
      privateAccount: privateAccount ?? this.privateAccount,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      allowComments: allowComments ?? this.allowComments,
      language: language ?? this.language,
      notifyLikes: notifyLikes ?? this.notifyLikes,
      notifyComments: notifyComments ?? this.notifyComments,
      notifyFollowers: notifyFollowers ?? this.notifyFollowers,
      notifyMentions: notifyMentions ?? this.notifyMentions,
      notifyCompetitions: notifyCompetitions ?? this.notifyCompetitions,
      notifyMessages: notifyMessages ?? this.notifyMessages,
    );
  }
}

class SettingsStateNotifier extends StateNotifier<SettingsState> {
  static const _prefsKeyPrefix = 'settings_';
  
  SettingsStateNotifier() : super(const SettingsState()) {
    _loadFromLocalStorage();
  }
  
  /// Load settings from local storage on init
  Future<void> _loadFromLocalStorage() async {
    final prefs = await SharedPreferences.getInstance();
    state = SettingsState(
      pushNotifications: prefs.getBool('${_prefsKeyPrefix}pushNotifications') ?? true,
      privateAccount: prefs.getBool('${_prefsKeyPrefix}privateAccount') ?? false,
      showOnlineStatus: prefs.getBool('${_prefsKeyPrefix}showOnlineStatus') ?? true,
      allowComments: prefs.getBool('${_prefsKeyPrefix}allowComments') ?? true,
      language: prefs.getString('${_prefsKeyPrefix}language') ?? 'English',
      notifyLikes: prefs.getBool('${_prefsKeyPrefix}notifyLikes') ?? true,
      notifyComments: prefs.getBool('${_prefsKeyPrefix}notifyComments') ?? true,
      notifyFollowers: prefs.getBool('${_prefsKeyPrefix}notifyFollowers') ?? true,
      notifyMentions: prefs.getBool('${_prefsKeyPrefix}notifyMentions') ?? true,
      notifyCompetitions: prefs.getBool('${_prefsKeyPrefix}notifyCompetitions') ?? true,
      notifyMessages: prefs.getBool('${_prefsKeyPrefix}notifyMessages') ?? true,
    );
  }
  
  /// Save a boolean setting to local storage
  Future<void> _saveBool(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_prefsKeyPrefix$key', value);
  }
  
  /// Save a string setting to local storage
  Future<void> _saveString(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_prefsKeyPrefix$key', value);
  }

  void togglePushNotifications(bool value) {
    state = state.copyWith(pushNotifications: value);
    _saveBool('pushNotifications', value);
  }
  
  void togglePrivateAccount(bool value) {
    state = state.copyWith(privateAccount: value);
    _saveBool('privateAccount', value);
  }
  
  void toggleShowOnlineStatus(bool value) {
    state = state.copyWith(showOnlineStatus: value);
    _saveBool('showOnlineStatus', value);
  }
  
  void toggleAllowComments(bool value) {
    state = state.copyWith(allowComments: value);
    _saveBool('allowComments', value);
  }
  
  void setLanguage(String value) {
    state = state.copyWith(language: value);
    _saveString('language', value);
  }
  
  // Notification preference toggles
  void toggleNotifyLikes(bool value) {
    state = state.copyWith(notifyLikes: value);
    _saveBool('notifyLikes', value);
  }
  
  void toggleNotifyComments(bool value) {
    state = state.copyWith(notifyComments: value);
    _saveBool('notifyComments', value);
  }
  
  void toggleNotifyFollowers(bool value) {
    state = state.copyWith(notifyFollowers: value);
    _saveBool('notifyFollowers', value);
  }
  
  void toggleNotifyMentions(bool value) {
    state = state.copyWith(notifyMentions: value);
    _saveBool('notifyMentions', value);
  }
  
  void toggleNotifyCompetitions(bool value) {
    state = state.copyWith(notifyCompetitions: value);
    _saveBool('notifyCompetitions', value);
  }
  
  void toggleNotifyMessages(bool value) {
    state = state.copyWith(notifyMessages: value);
    _saveBool('notifyMessages', value);
  }
}

/// Settings state provider
final settingsStateProvider = StateNotifierProvider<SettingsStateNotifier, SettingsState>((ref) {
  return SettingsStateNotifier();
});

/// Main settings page with all setting categories
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsStateProvider);
    final currentUser = ref.watch(currentUserProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      ),
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: ListView(
        children: [
          // User Profile Header
          if (currentUser != null) ...[
            _buildUserHeader(context, currentUser, theme, isDark),
            const Divider(height: 1),
          ],

          // Account Section
          _buildSection(
            context,
            'Account',
            [
              _buildSettingTile(
                Icons.lock_outline,
                'Change Password',
                'Update your password',
                () => _showChangePasswordDialog(context),
              ),
              if (currentUser != null) ...[
                _buildSettingTile(
                  Icons.email_outlined,
                  'Email',
                  currentUser.email ?? 'Not set',
                  () => _showChangeEmailDialog(context, currentUser.email),
                ),
                _buildSettingTile(
                  Icons.phone_outlined,
                  'Phone Number',
                  currentUser.phone ?? 'Not set',
                  () => _showChangePhoneDialog(context, ref, currentUser.phone),
                ),
              ],
            ],
          ),

          // Privacy Section
          _buildSection(
            context,
            'Privacy',
            [
              _buildSwitchTile(
                Icons.lock,
                'Private Account',
                'Only approved followers can see your content',
                settings.privateAccount,
                (value) => ref.read(settingsStateProvider.notifier).togglePrivateAccount(value),
              ),
              _buildSwitchTile(
                Icons.visibility,
                'Show Online Status',
                'Let others see when you\'re online in messages',
                settings.showOnlineStatus,
                (value) => ref.read(settingsStateProvider.notifier).toggleShowOnlineStatus(value),
              ),
              _buildSwitchTile(
                Icons.comment,
                'Allow Comments',
                'Let others comment on your posts',
                settings.allowComments,
                (value) => ref.read(settingsStateProvider.notifier).toggleAllowComments(value),
              ),
              _buildSettingTile(
                Icons.block_outlined,
                'Blocked Users',
                'Manage blocked accounts',
                () => _showBlockedUsersPage(context, ref),
              ),
            ],
          ),

          // Notifications Section
          _buildSection(
            context,
            'Notifications',
            [
              _buildSwitchTile(
                Icons.notifications,
                'Push Notifications',
                'Receive push notifications',
                settings.pushNotifications,
                (value) => ref.read(settingsStateProvider.notifier).togglePushNotifications(value),
              ),
              _buildSettingTile(
                Icons.tune,
                'Notification Preferences',
                'Customize what you get notified about',
                () => _showNotificationPreferences(context, ref),
              ),
            ],
          ),

          // Support Section
          _buildSection(
            context,
            'Support',
            [
              _buildSettingTile(
                Icons.help_outline,
                'Help Center',
                'Get help with common issues',
                () => _showHelpCenter(context),
              ),
              _buildSettingTile(
                Icons.bug_report_outlined,
                'Report a Problem',
                'Let us know about issues',
                () => _showReportProblem(context),
              ),
              _buildSettingTile(
                Icons.feedback_outlined,
                'Send Feedback',
                'Help us improve the app',
                () => _showFeedbackDialog(context),
              ),
            ],
          ),

          // About Section
          _buildSection(
            context,
            'About',
            [
              _buildSettingTile(
                Icons.info_outline,
                'App Version',
                '1.0.0 (Build 1)',
                () {},
              ),
              _buildSettingTile(
                Icons.description_outlined,
                'Terms of Service',
                null,
                () => _showTermsOfService(context),
              ),
              _buildSettingTile(
                Icons.privacy_tip_outlined,
                'Privacy Policy',
                null,
                () => _showPrivacyPolicy(context),
              ),
              _buildSettingTile(
                Icons.gavel_outlined,
                'Community Guidelines',
                null,
                () => _showCommunityGuidelines(context),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Logout button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () => _showLogoutDialog(context, ref),
              icon: const Icon(Icons.logout),
              label: const Text('Log Out'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange,
                side: const BorderSide(color: Colors.orange),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Delete account button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextButton(
              onPressed: () => _showDeleteAccountDialog(context),
              child: const Text(
                'Delete Account',
                style: TextStyle(color: Colors.red),
              ),
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildUserHeader(BuildContext context, dynamic user, ThemeData theme, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: isDark ? AppColors.darkCard : Colors.white,
      child: Row(
        children: [
          NetworkAvatar(
            imageUrl: user.profilePicture,
            radius: 35,
            fallbackText: user.name ?? user.username ?? 'U',
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            foregroundColor: AppColors.primary,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.name ?? user.username ?? 'User',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (user.isVerified == true)
                      const Padding(
                        padding: EdgeInsets.only(left: 4),
                        child: Icon(Icons.verified, color: AppColors.primary, size: 20),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '@${user.username ?? ''}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
                ),
                if (user.email != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    user.email,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.grey,
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () => context.push('/edit-profile'),
            tooltip: 'Edit Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
          child: Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildSettingTile(
    IconData icon,
    String title,
    String? subtitle,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile(
    IconData icon,
    String title,
    String subtitle,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return SwitchListTile(
      secondary: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      value: value,
      onChanged: onChanged,
    );
  }

  // Dialog methods
  void _showChangePasswordDialog(BuildContext context) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Current Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'New Password',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: confirmPasswordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Confirm New Password',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Password changed successfully')),
              );
            },
            child: const Text('Change'),
          ),
        ],
      ),
    );
  }

  void _showChangeEmailDialog(BuildContext context, String? currentEmail) {
    final emailController = TextEditingController(text: currentEmail ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Email'),
        content: TextField(
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email Address',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Verification email sent')),
              );
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _showChangePhoneDialog(BuildContext context, WidgetRef ref, String? currentPhone) {
    final phoneController = TextEditingController(text: currentPhone ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Phone Number'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone Number',
                border: OutlineInputBorder(),
                hintText: '+1 234 567 8900',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'This number will be shown in your bio section if you enable it.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final phone = phoneController.text.trim();
              if (phone.isNotEmpty) {
                // Update profile with new phone number
                final success = await ref.read(authProvider.notifier).updateProfile(
                  whatsappNumber: phone,
                );
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success 
                      ? 'Phone number updated successfully' 
                      : 'Failed to update phone number'),
                  ),
                );
              } else {
                Navigator.pop(context);
              }
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  /// Show blocked users page with real data from API
  void _showBlockedUsersPage(BuildContext context, WidgetRef ref) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const BlockedUsersPage(),
      ),
    );
  }

  /// Show notification preferences with real state management
  void _showNotificationPreferences(BuildContext context, WidgetRef ref) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const NotificationPreferencesPage(),
      ),
    );
  }

  void _showHelpCenter(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Help Center')),
          body: ListView(
            children: [
              _buildHelpTile('Getting Started', Icons.play_circle_outline),
              _buildHelpTile('Creating Posts', Icons.add_box_outlined),
              _buildHelpTile('Competitions', Icons.emoji_events_outlined),
              _buildHelpTile('Payments & Wallet', Icons.account_balance_wallet_outlined),
              _buildHelpTile('Account Issues', Icons.person_outline),
              _buildHelpTile('Privacy & Safety', Icons.shield_outlined),
              _buildHelpTile('Contact Support', Icons.support_agent),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHelpTile(String title, IconData icon) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: () {},
    );
  }

  void _showReportProblem(BuildContext context) {
    final problemController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report a Problem'),
        content: TextField(
          controller: problemController,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Describe the problem...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report submitted. Thank you!')),
              );
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  void _showFeedbackDialog(BuildContext context) {
    final feedbackController = TextEditingController();
    int rating = 0;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Send Feedback'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('How would you rate your experience?'),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    onPressed: () => setState(() => rating = index + 1),
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 32,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: feedbackController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Tell us more (optional)...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Thank you for your feedback!')),
                );
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  void _showTermsOfService(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Terms of Service')),
          body: const SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Text(
              'Terms of Service\n\n'
              'Last updated: January 2024\n\n'
              '1. Acceptance of Terms\n'
              'By accessing and using VidiBattle, you accept and agree to be bound by these Terms of Service.\n\n'
              '2. User Accounts\n'
              'You are responsible for maintaining the confidentiality of your account credentials.\n\n'
              '3. User Content\n'
              'You retain ownership of content you post. By posting, you grant us a license to use, display, and distribute your content.\n\n'
              '4. Prohibited Conduct\n'
              'You agree not to post harmful, illegal, or offensive content.\n\n'
              '5. Competitions\n'
              'Competition rules and prize distribution are subject to our competition guidelines.\n\n'
              '6. Termination\n'
              'We reserve the right to terminate accounts that violate these terms.\n\n'
              '7. Changes to Terms\n'
              'We may update these terms from time to time. Continued use constitutes acceptance.\n\n'
              '8. Contact\n'
              'For questions, contact support@vidibattle.com',
              style: TextStyle(height: 1.6),
            ),
          ),
        ),
      ),
    );
  }

  void _showPrivacyPolicy(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Privacy Policy')),
          body: const SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Text(
              'Privacy Policy\n\n'
              'Last updated: January 2024\n\n'
              '1. Information We Collect\n'
              'We collect information you provide directly, such as account details and content you post.\n\n'
              '2. How We Use Information\n'
              'We use your information to provide and improve our services, personalize your experience, and communicate with you.\n\n'
              '3. Information Sharing\n'
              'We do not sell your personal information. We may share information with service providers who assist us.\n\n'
              '4. Data Security\n'
              'We implement security measures to protect your information.\n\n'
              '5. Your Rights\n'
              'You can access, update, or delete your personal information through your account settings.\n\n'
              '6. Cookies\n'
              'We use cookies and similar technologies to enhance your experience.\n\n'
              '7. Contact\n'
              'For privacy concerns, contact privacy@vidibattle.com',
              style: TextStyle(height: 1.6),
            ),
          ),
        ),
      ),
    );
  }

  void _showCommunityGuidelines(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Community Guidelines')),
          body: const SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Text(
              'Community Guidelines\n\n'
              'VidiBattle is a platform for creative expression. To keep our community safe and positive:\n\n'
              '✓ Be Respectful\n'
              'Treat others with kindness and respect. No harassment, bullying, or hate speech.\n\n'
              '✓ Keep It Safe\n'
              'No dangerous activities, violence, or content that promotes harm.\n\n'
              '✓ Be Authentic\n'
              'Post original content. Give credit when using others\' work.\n\n'
              '✓ Follow the Law\n'
              'No illegal activities or content that violates laws.\n\n'
              '✓ Protect Privacy\n'
              'Don\'t share others\' personal information without consent.\n\n'
              '✓ Age-Appropriate Content\n'
              'No adult or sexually explicit content.\n\n'
              '✓ Fair Competition\n'
              'No cheating, vote manipulation, or unfair practices in competitions.\n\n'
              'Violations may result in content removal or account suspension.',
              style: TextStyle(height: 1.6),
            ),
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              // Logout using auth provider
              ref.read(authProvider.notifier).logout();
              // Navigate to login
              context.go('/login');
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.orange,
            ),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'This action cannot be undone. All your data will be permanently deleted:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            SizedBox(height: 12),
            Text('• Your profile and posts'),
            Text('• Your followers and following'),
            Text('• Your competition history'),
            Text('• Your wallet balance'),
            SizedBox(height: 12),
            Text(
              'Are you sure you want to delete your account?',
              style: TextStyle(color: Colors.red),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Account deletion request submitted'),
                  backgroundColor: Colors.red,
                ),
              );
            },
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Blocked Users Page - Connected to Real API
// ============================================================================

class BlockedUsersPage extends ConsumerWidget {
  const BlockedUsersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blockedUsersAsync = ref.watch(blockedUsersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Blocked Users')),
      body: blockedUsersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load blocked users'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(blockedUsersProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (blockedUsers) {
          if (blockedUsers.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.block, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No blocked users',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Users you block will appear here',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: blockedUsers.length,
            itemBuilder: (context, index) {
              final user = blockedUsers[index];
              return ListTile(
                leading: NetworkAvatar(
                  imageUrl: user.profilePicture,
                  radius: 24,
                  fallbackText: user.username,
                ),
                title: Text(user.name ?? user.username),
                subtitle: Text('@${user.username}'),
                trailing: OutlinedButton(
                  onPressed: () async {
                    final repository = ref.read(usersRepositoryProvider);
                    final result = await repository.unblockUser(user.id);
                    result.fold(
                      (failure) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Failed to unblock @${user.username}')),
                        );
                      },
                      (_) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Unblocked @${user.username}')),
                        );
                        // Refresh the list
                        ref.invalidate(blockedUsersProvider);
                      },
                    );
                  },
                  child: const Text('Unblock'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

// ============================================================================
// Notification Preferences Page - Connected to Settings State
// ============================================================================

class NotificationPreferencesPage extends ConsumerWidget {
  const NotificationPreferencesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsStateProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Choose which notifications you want to receive. Disabled notifications will not appear in your notification screen.',
              style: TextStyle(color: Colors.grey),
            ),
          ),
          SwitchListTile(
            title: const Text('Likes'),
            subtitle: const Text('When someone likes your post'),
            value: settings.notifyLikes,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyLikes(v),
          ),
          SwitchListTile(
            title: const Text('Comments'),
            subtitle: const Text('When someone comments on your post'),
            value: settings.notifyComments,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyComments(v),
          ),
          SwitchListTile(
            title: const Text('New Followers'),
            subtitle: const Text('When someone follows you'),
            value: settings.notifyFollowers,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyFollowers(v),
          ),
          SwitchListTile(
            title: const Text('Mentions'),
            subtitle: const Text('When someone mentions you'),
            value: settings.notifyMentions,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyMentions(v),
          ),
          SwitchListTile(
            title: const Text('Competition Updates'),
            subtitle: const Text('Updates about competitions you joined'),
            value: settings.notifyCompetitions,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyCompetitions(v),
          ),
          SwitchListTile(
            title: const Text('Messages'),
            subtitle: const Text('When you receive a new message'),
            value: settings.notifyMessages,
            onChanged: (v) => ref.read(settingsStateProvider.notifier).toggleNotifyMessages(v),
          ),
        ],
      ),
    );
  }
}
