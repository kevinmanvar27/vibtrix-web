import 'package:flutter/material.dart';

/// App Colors based on VidiBattle website theme
/// Primary: Orange (HSL 30, 100%, 50%) = #FF8000
/// Dark theme with warm undertones
class AppColors {
  AppColors._();

  // ============ PRIMARY COLORS ============
  // Primary Orange (from --primary: 30 100% 50%)
  static const Color primary = Color(0xFFFF8000);
  static const Color primaryLight = Color(0xFFFFAB40);
  static const Color primaryDark = Color(0xFFCC6600);
  
  // Primary variants for dark mode (from --primary: 30 90% 45%)
  static const Color primaryDarkMode = Color(0xFFDA7A0C);

  // ============ LIGHT THEME COLORS ============
  static const Color lightBackground = Color(0xFFF1F1F2); // --background: 224, 5%, 95%
  static const Color lightForeground = Color(0xFF0A0A0B); // --foreground: 240 10% 3.9%
  static const Color lightCard = Color(0xFFFFFFFF); // --card: 0 0% 100%
  static const Color lightCardForeground = Color(0xFF0A0A0B);
  static const Color lightMuted = Color(0xFFF4F4F5); // --muted: 240 4.8% 95.9%
  static const Color lightMutedForeground = Color(0xFF71717A); // --muted-foreground: 240 3.8% 46.1%
  static const Color lightBorder = Color(0xFFE4E4E7); // --border: 240 5.9% 90%
  static const Color lightInput = Color(0xFFE4E4E7);

  // ============ DARK THEME COLORS ============
  static const Color darkBackground = Color(0xFF0C0A09); // --background: 20 14.3% 4.1%
  static const Color darkForeground = Color(0xFFF2F2F2); // --foreground: 0 0% 95%
  static const Color darkCard = Color(0xFF1C1917); // --card: 24 9.8% 10%
  static const Color darkCardForeground = Color(0xFFF2F2F2);
  static const Color darkMuted = Color(0xFF262626); // --muted: 0 0% 15%
  static const Color darkMutedForeground = Color(0xFFA1A1AA); // --muted-foreground: 240 5% 64.9%
  static const Color darkBorder = Color(0xFF27272A); // --border: 240 3.7% 15.9%
  static const Color darkInput = Color(0xFF27272A);
  static const Color darkAccent = Color(0xFF292524); // --accent: 12 6.5% 15.1%

  // ============ SEMANTIC COLORS ============
  static const Color success = Color(0xFF22C55E);
  static const Color successLight = Color(0xFF4ADE80);
  static const Color successDark = Color(0xFF16A34A);

  static const Color error = Color(0xFFEF4444); // --destructive: 0 84.2% 60.2%
  static const Color errorLight = Color(0xFFF87171);
  static const Color errorDark = Color(0xFFDC2626);

  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFBBF24);
  static const Color warningDark = Color(0xFFD97706);

  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFF60A5FA);
  static const Color infoDark = Color(0xFF2563EB);

  // ============ SOCIAL COLORS ============
  static const Color like = Color(0xFFEF4444);
  static const Color comment = Color(0xFF3B82F6);
  static const Color share = Color(0xFF22C55E);
  static const Color bookmark = Color(0xFFF59E0B);

  // ============ GRADIENT COLORS ============
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkGradient = LinearGradient(
    colors: [darkBackground, darkCard],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ============ SHIMMER COLORS ============
  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
  static const Color shimmerBaseDark = Color(0xFF2A2A2A);
  static const Color shimmerHighlightDark = Color(0xFF3A3A3A);

  // ============ OVERLAY COLORS ============
  static const Color overlayLight = Color(0x80000000);
  static const Color overlayDark = Color(0xB3000000);
  static const Color scrim = Color(0x52000000);

  // ============ TRANSPARENT ============
  static const Color transparent = Colors.transparent;
  static const Color white = Colors.white;
  static const Color black = Colors.black;
}
