import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/network_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

/// Page for editing user profile information
/// CONNECTED TO REAL API
class EditProfilePage extends ConsumerStatefulWidget {
  const EditProfilePage({super.key});

  @override
  ConsumerState<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends ConsumerState<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _usernameController;
  late TextEditingController _bioController;
  late TextEditingController _nameController;
  late TextEditingController _websiteController;
  
  bool _isSaving = false;
  bool _hasChanges = false;
  bool _isPrivate = false;

  @override
  void initState() {
    super.initState();
    // Initialize with current user data from auth provider
    final authState = ref.read(authProvider);
    final currentUser = authState.user;
    
    _nameController = TextEditingController(text: currentUser?.name ?? '');
    _usernameController = TextEditingController(text: currentUser?.username ?? '');
    _bioController = TextEditingController(text: currentUser?.bio ?? '');
    _websiteController = TextEditingController(text: '');
    _isPrivate = currentUser?.isPrivate ?? false;
    
    // Listen for changes
    _nameController.addListener(_onFieldChanged);
    _usernameController.addListener(_onFieldChanged);
    _bioController.addListener(_onFieldChanged);
    _websiteController.addListener(_onFieldChanged);
  }

  void _onFieldChanged() {
    if (!_hasChanges) {
      setState(() => _hasChanges = true);
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _bioController.dispose();
    _nameController.dispose();
    _websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final currentUser = authState.user;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        elevation: 0,
        title: const Text('Edit Profile'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => _handleBack(context),
        ),
        actions: [
          TextButton(
            onPressed: _hasChanges && !_isSaving ? _saveProfile : null,
            child: _isSaving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    'Save',
                    style: TextStyle(
                      color: _hasChanges ? AppColors.primary : Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
      body: currentUser == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Profile picture section
                    Center(
                      child: Column(
                        children: [
                          Stack(
                            children: [
                              NetworkAvatar(
                                imageUrl: currentUser.profilePicture,
                                radius: 50,
                                fallbackText: currentUser.name ?? currentUser.username,
                                backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                                foregroundColor: AppColors.primary,
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: GestureDetector(
                                  onTap: _showImageOptions,
                                  child: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
                                        width: 2,
                                      ),
                                    ),
                                    child: const Icon(
                                      Icons.camera_alt,
                                      size: 16,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextButton(
                            onPressed: _showImageOptions,
                            child: const Text(
                              'Change Profile Photo',
                              style: TextStyle(color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Name field
                    _buildTextField(
                      controller: _nameController,
                      label: 'Name',
                      hint: 'Your display name',
                      maxLength: 30,
                    ),
                    const SizedBox(height: 16),
                    
                    // Username field
                    _buildTextField(
                      controller: _usernameController,
                      label: 'Username',
                      hint: 'Your unique username',
                      prefixText: '@',
                      maxLength: 20,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Username is required';
                        }
                        if (value.length < 3) {
                          return 'Username must be at least 3 characters';
                        }
                        if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                          return 'Only letters, numbers and underscores allowed';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    
                    // Bio field
                    _buildTextField(
                      controller: _bioController,
                      label: 'Bio',
                      hint: 'Tell us about yourself...',
                      maxLines: 3,
                      maxLength: 150,
                    ),
                    const SizedBox(height: 16),
                    
                    // Website field
                    _buildTextField(
                      controller: _websiteController,
                      label: 'Website',
                      hint: 'https://yourwebsite.com',
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 32),
                    
                    // Additional options
                    _buildOptionTile(
                      icon: Icons.lock_outline,
                      title: 'Private Account',
                      subtitle: 'Only approved followers can see your posts',
                      trailing: Switch(
                        value: _isPrivate,
                        onChanged: (value) {
                          setState(() {
                            _isPrivate = value;
                            _hasChanges = true;
                          });
                        },
                        activeTrackColor: AppColors.primary,
                      ),
                    ),
                    const Divider(),
                    _buildOptionTile(
                      icon: Icons.person_outline,
                      title: 'Personal Information',
                      subtitle: 'Email, phone number, gender',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Personal info settings coming soon!')),
                        );
                      },
                    ),
                    const Divider(),
                    _buildOptionTile(
                      icon: Icons.link,
                      title: 'Links',
                      subtitle: 'Add external links to your profile',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Links settings coming soon!')),
                        );
                      },
                    ),
                    
                    // Show error if any
                    if (authState.errorMessage != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authState.errorMessage!,
                                style: const TextStyle(color: AppColors.error),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    String? prefixText,
    int maxLines = 1,
    int? maxLength,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    final theme = Theme.of(context);
    
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      maxLength: maxLength,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixText: prefixText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: theme.dividerColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        filled: true,
        fillColor: theme.cardColor,
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);
    
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: theme.colorScheme.onSurface),
      title: Text(title),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
          fontSize: 12,
        ),
      ),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Camera feature coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Gallery feature coming soon!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.error),
              title: const Text('Remove Photo', style: TextStyle(color: AppColors.error)),
              onTap: () async {
                Navigator.pop(context);
                // Call API to remove photo
                final success = await ref.read(authProvider.notifier).deleteProfilePicture();
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'Photo removed!' : 'Failed to remove photo'),
                      backgroundColor: success ? AppColors.success : AppColors.error,
                    ),
                  );
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  void _handleBack(BuildContext context) {
    if (_hasChanges) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Discard Changes?'),
          content: const Text('You have unsaved changes. Are you sure you want to discard them?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Keep Editing'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text('Discard', style: TextStyle(color: AppColors.error)),
            ),
          ],
        ),
      );
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _saveProfile() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() => _isSaving = true);

    // Call real API to update profile
    // Note: Backend uses isProfilePublic (inverse of isPrivate)
    final success = await ref.read(authProvider.notifier).updateProfile(
      name: _nameController.text.trim(),
      username: _usernameController.text.trim(),
      bio: _bioController.text.trim(),
      isProfilePublic: !_isPrivate,  // Convert isPrivate to isProfilePublic
    );

    setState(() => _isSaving = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.pop(context);
      } else {
        // Error is already shown in the UI from authState.errorMessage
      }
    }
  }
}
