import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../router/route_names.dart';
import '../theme/app_colors.dart';

/// Main scaffold with bottom navigation bar
/// 
/// Used as the shell for the main navigation tabs:
/// - Feed (Home)
/// - Explore
/// - Create (FAB)
/// - Competitions
/// - Profile
class MainScaffold extends ConsumerStatefulWidget {
  final Widget child;
  
  const MainScaffold({
    super.key,
    required this.child,
  });
  
  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  /// Get current index based on route
  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    
    if (location == RouteNames.home || location == RouteNames.feed) {
      return 0;
    } else if (location == RouteNames.explore) {
      return 1;
    } else if (location == RouteNames.competitions) {
      return 2;
    } else if (location == RouteNames.chat) {
      return 3;
    } else if (location == RouteNames.profile) {
      return 4;
    }
    
    return 0;
  }
  
  /// Navigate to tab
  void _onTabTapped(int index) {
    switch (index) {
      case 0:
        context.go(RouteNames.home);
        break;
      case 1:
        context.go(RouteNames.explore);
        break;
      case 2:
        context.go(RouteNames.competitions);
        break;
      case 3:
        context.go(RouteNames.chat);
        break;
      case 4:
        context.go(RouteNames.profile);
        break;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Scaffold(
      body: widget.child,
      
      // Floating action button for creating posts
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push(RouteNames.createPost),
        backgroundColor: isDark ? AppColors.primaryDark : AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        child: const Icon(Icons.add_rounded, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      
      // Bottom navigation bar
      bottomNavigationBar: _BottomNavBar(
        currentIndex: currentIndex,
        onTap: _onTabTapped,
      ),
    );
  }
}

/// Custom bottom navigation bar with notch for FAB
class _BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  
  const _BottomNavBar({
    required this.currentIndex,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    // ignore: unused_local_variable
    final _ = Theme.of(context);
    
    return BottomAppBar(
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      padding: EdgeInsets.zero,
      height: 64,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // Feed
          _NavBarItem(
            icon: Icons.home_outlined,
            activeIcon: Icons.home_rounded,
            label: 'Feed',
            isSelected: currentIndex == 0,
            onTap: () => onTap(0),
          ),
          
          // Explore
          _NavBarItem(
            icon: Icons.explore_outlined,
            activeIcon: Icons.explore_rounded,
            label: 'Explore',
            isSelected: currentIndex == 1,
            onTap: () => onTap(1),
          ),
          
          // Spacer for FAB
          const SizedBox(width: 56),
          
          // Competitions
          _NavBarItem(
            icon: Icons.emoji_events_outlined,
            activeIcon: Icons.emoji_events_rounded,
            label: 'Battles',
            isSelected: currentIndex == 2,
            onTap: () => onTap(2),
          ),
          
          // Profile
          _NavBarItem(
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: 'Profile',
            isSelected: currentIndex == 4,
            onTap: () => onTap(4),
          ),
        ],
      ),
    );
  }
}

/// Individual navigation bar item
class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  
  const _NavBarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primaryColor = isDark ? AppColors.primaryDark : AppColors.primary;
    
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? activeIcon : icon,
              color: isSelected 
                  ? primaryColor 
                  : theme.colorScheme.onSurfaceVariant,
              size: 24,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isSelected 
                    ? primaryColor 
                    : theme.colorScheme.onSurfaceVariant,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
