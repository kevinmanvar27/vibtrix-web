import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Settings state provider
final settingsStateProvider = StateNotifierProvider<SettingsStateNotifier, SettingsState>((ref) {
  return SettingsStateNotifier();
});

class SettingsState {
  final bool isDarkMode;
  final bool pushNotifications;
  final bool emailNotifications;
  final bool privateAccount;
  final bool showOnlineStatus;
  final bool allowComments;
  final bool allowDuets;
  final String language;

  const SettingsState({
    this.isDarkMode = false,
    this.pushNotifications = true,
    this.emailNotifications = true,
    this.privateAccount = false,
    this.showOnlineStatus = true,
    this.allowComments = true,
    this.allowDuets = true,
    this.language = 'English',
  });

  SettingsState copyWith({
    bool? isDarkMode,
    bool? pushNotifications,
    bool? emailNotifications,
    bool? privateAccount,
    bool? showOnlineStatus,
    bool? allowComments,
    bool? allowDuets,
    String? language,
  }) {
    return SettingsState(
      isDarkMode: isDarkMode ?? this.isDarkMode,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      emailNotifications: emailNotifications ?? this.emailNotifications,
      privateAccount: privateAccount ?? this.privateAccount,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      allowComments: allowComments ?? this.allowComments,
      allowDuets: allowDuets ?? this.allowDuets,
      language: language ?? this.language,
    );
  }
}

class SettingsStateNotifier extends StateNotifier<SettingsState> {
  SettingsStateNotifier() : super(const SettingsState());

  void toggleDarkMode(bool value) => state = state.copyWith(isDarkMode: value);
  void togglePushNotifications(bool value) => state = state.copyWith(pushNotifications: value);
  void toggleEmailNotifications(bool value) => state = state.copyWith(emailNotifications: value);
  void togglePrivateAccount(bool value) => state = state.copyWith(privateAccount: value);
  void toggleShowOnlineStatus(bool value) => state = state.copyWith(showOnlineStatus: value);
  void toggleAllowComments(bool value) => state = state.copyWith(allowComments: value);
  void toggleAllowDuets(bool value) => state = state.copyWith(allowDuets: value);
  void setLanguage(String value) => state = state.copyWith(language: value);
}

/// Main settings page with all setting categories
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // Account Section
          _buildSection(
            context,
            'Account',
            [
              _buildSettingTile(
                Icons.person_outline,
                'Edit Profile',
                'Change your profile information',
                () => Navigator.pushNamed(context, '/edit-profile'),
              ),
              _buildSettingTile(
                Icons.lock_outline,
                'Change Password',
                'Update your password',
                () => _showChangePasswordDialog(context),
              ),
              _buildSettingTile(
                Icons.email_outlined,
                'Email',
                'demo@vidibattle.com',
                () => _showChangeEmailDialog(context),
              ),
              _buildSettingTile(
                Icons.phone_outlined,
                'Phone Number',
                '+91 98765 43210',
                () => _showChangePhoneDialog(context),
              ),
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
                'Let others see when you\'re online',
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
              _buildSwitchTile(
                Icons.people,
                'Allow Duets',
                'Let others create duets with your videos',
                settings.allowDuets,
                (value) => ref.read(settingsStateProvider.notifier).toggleAllowDuets(value),
              ),
              _buildSettingTile(
                Icons.block_outlined,
                'Blocked Users',
                'Manage blocked accounts',
                () => _showBlockedUsersPage(context),
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
              _buildSwitchTile(
                Icons.email,
                'Email Notifications',
                'Receive email updates',
                settings.emailNotifications,
                (value) => ref.read(settingsStateProvider.notifier).toggleEmailNotifications(value),
              ),
              _buildSettingTile(
                Icons.tune,
                'Notification Preferences',
                'Customize what you get notified about',
                () => _showNotificationPreferences(context),
              ),
            ],
          ),

          // Appearance Section
          _buildSection(
            context,
            'Appearance',
            [
              _buildSwitchTile(
                Icons.dark_mode,
                'Dark Mode',
                'Use dark theme',
                settings.isDarkMode,
                (value) => ref.read(settingsStateProvider.notifier).toggleDarkMode(value),
              ),
              _buildSettingTile(
                Icons.language,
                'Language',
                settings.language,
                () => _showLanguageSelector(context, ref),
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
              onPressed: () => _showLogoutDialog(context),
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

  void _showChangeEmailDialog(BuildContext context) {
    final emailController = TextEditingController(text: 'demo@vidibattle.com');

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

  void _showChangePhoneDialog(BuildContext context) {
    final phoneController = TextEditingController(text: '+91 98765 43210');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change Phone Number'),
        content: TextField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Phone Number',
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
                const SnackBar(content: Text('OTP sent to new number')),
              );
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }

  void _showBlockedUsersPage(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Blocked Users')),
          body: ListView.builder(
            itemCount: 3,
            itemBuilder: (context, index) {
              final users = ['blocked_user1', 'spam_account', 'annoying_person'];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.grey.shade300,
                  child: const Icon(Icons.person),
                ),
                title: Text('@${users[index]}'),
                trailing: OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Unblocked @${users[index]}')),
                    );
                  },
                  child: const Text('Unblock'),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showNotificationPreferences(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(title: const Text('Notification Preferences')),
          body: ListView(
            children: [
              SwitchListTile(
                title: const Text('Likes'),
                subtitle: const Text('When someone likes your post'),
                value: true,
                onChanged: (v) {},
              ),
              SwitchListTile(
                title: const Text('Comments'),
                subtitle: const Text('When someone comments on your post'),
                value: true,
                onChanged: (v) {},
              ),
              SwitchListTile(
                title: const Text('New Followers'),
                subtitle: const Text('When someone follows you'),
                value: true,
                onChanged: (v) {},
              ),
              SwitchListTile(
                title: const Text('Mentions'),
                subtitle: const Text('When someone mentions you'),
                value: true,
                onChanged: (v) {},
              ),
              SwitchListTile(
                title: const Text('Competition Updates'),
                subtitle: const Text('Updates about competitions you joined'),
                value: true,
                onChanged: (v) {},
              ),
              SwitchListTile(
                title: const Text('Messages'),
                subtitle: const Text('When you receive a new message'),
                value: true,
                onChanged: (v) {},
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguageSelector(BuildContext context, WidgetRef ref) {
    final languages = ['English', 'हिंदी', 'தமிழ்', 'తెలుగు', 'मराठी', 'বাংলা'];
    final currentLanguage = ref.read(settingsStateProvider).language;

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Select Language',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            ...languages.map((lang) => ListTile(
                  title: Text(lang),
                  trailing: currentLanguage == lang
                      ? const Icon(Icons.check, color: Colors.green)
                      : null,
                  onTap: () {
                    ref.read(settingsStateProvider.notifier).setLanguage(lang);
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Language changed to $lang')),
                    );
                  },
                )),
            const SizedBox(height: 16),
          ],
        ),
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

  void _showLogoutDialog(BuildContext context) {
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
              // Navigate to login
              Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
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
