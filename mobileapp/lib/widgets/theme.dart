import 'package:flutter/material.dart';

/// 墨色主题：与 web / admin 的设计语言一致（ink / paper / cinnabar / bronze）。
class AppTheme {
  AppTheme._();

  static const ink = Color(0xFF0E0B08);
  static const inkCard = Color(0xFF171310);
  static const inkSoft = Color(0xFF2B2620);
  static const paper = Color(0xFFF2EAD8);
  static const paperDim = Color(0xFFC9BFA6);
  static const cinnabar = Color(0xFF9B2B2B);
  static const cinnabarLight = Color(0xFFC04A3A);
  static const bronze = Color(0xFF8C6B3A);
  static const bronzeLight = Color(0xFFB9975B);
  static const bamboo = Color(0xFF3E544A);
  static const bambooLight = Color(0xFF6E8F7E);

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: ink,
        colorScheme: const ColorScheme.dark(
          primary: cinnabar,
          onPrimary: paper,
          secondary: bronzeLight,
          onSecondary: ink,
          surface: inkCard,
          onSurface: paper,
          error: cinnabarLight,
          onError: paper,
          outline: Color(0x33D9CBA8),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xD90E0B08),
          foregroundColor: paper,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: paper,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            letterSpacing: 4,
          ),
        ),
        cardTheme: CardThemeData(
          color: inkCard,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(3),
            side: BorderSide(color: paperDim.withValues(alpha: 0.15)),
          ),
          margin: EdgeInsets.zero,
        ),
        dividerColor: paperDim.withValues(alpha: 0.15),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: ink,
          hintStyle: TextStyle(color: paperDim.withValues(alpha: 0.5)),
          labelStyle: const TextStyle(color: paperDim, letterSpacing: 2),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: BorderSide(color: paperDim.withValues(alpha: 0.25)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: BorderSide(color: paperDim.withValues(alpha: 0.25)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: const BorderSide(color: bronzeLight),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: cinnabar.withValues(alpha: 0.9),
            foregroundColor: paper,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
            textStyle: const TextStyle(letterSpacing: 4, fontSize: 14),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: paperDim,
            side: BorderSide(color: paperDim.withValues(alpha: 0.3)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
            textStyle: const TextStyle(letterSpacing: 4, fontSize: 14),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: inkSoft,
          side: BorderSide(color: paperDim.withValues(alpha: 0.25)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
          labelStyle: const TextStyle(color: paperDim, fontSize: 12),
        ),
        snackBarTheme: SnackBarThemeData(
          backgroundColor: inkSoft,
          contentTextStyle: const TextStyle(color: paper),
          behavior: SnackBarBehavior.floating,
        ),
      );
}
