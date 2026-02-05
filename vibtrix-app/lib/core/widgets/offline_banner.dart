/// Offline banner widget that shows when there's no internet connection
/// Displays at the top of the screen with a retry option

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/connectivity_service.dart';
import '../providers/core_providers.dart';
import '../theme/app_colors.dart';

/// A banner that shows when the device is offline
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivityAsync = ref.watch(connectionStatusProvider);
    
    return connectivityAsync.when(
      data: (status) {
        if (status == ConnectionStatus.offline) {
          return _buildBanner(context, ref);
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildBanner(BuildContext context, WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppColors.error,
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            const Icon(
              Icons.wifi_off,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'No internet connection',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            TextButton(
              onPressed: () async {
                final connectivity = ref.read(connectivityProvider);
                await connectivity.checkConnectivity();
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

/// A wrapper widget that adds offline banner to any screen
class OfflineAwareScaffold extends ConsumerWidget {
  final PreferredSizeWidget? appBar;
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final Color? backgroundColor;
  final bool extendBody;
  final bool extendBodyBehindAppBar;

  const OfflineAwareScaffold({
    super.key,
    this.appBar,
    required this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.backgroundColor,
    this.extendBody = false,
    this.extendBodyBehindAppBar = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: appBar,
      backgroundColor: backgroundColor,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      body: Column(
        children: [
          const OfflineBanner(),
          Expanded(child: body),
        ],
      ),
    );
  }
}
