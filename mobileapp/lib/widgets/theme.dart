import 'package:flutter/material.dart';

/// 墨色主题：与 web / admin 的设计语言一致（ink / paper / cinnabar / bronze）。
/// 支持暗色（黑夜）/亮色（白天）：ink* 为背景语义色、paper* 为前景语义色，
/// 组件中硬编码引用这两个系列时随 applyBrightness 切换；点缀色两种主题通用。
class AppTheme {
  AppTheme._();

  // ---- 语义色（随主题明暗切换；不要在 const 语境使用）----
  static Color ink = const Color(0xFF0E0B08);
  static Color inkCard = const Color(0xFF171310);
  static Color inkSoft = const Color(0xFF2B2620);
  static Color paper = const Color(0xFFF2EAD8);
  static Color paperDim = const Color(0xFFC9BFA6);

  // ---- 点缀色（两种主题通用，保持 const）----
  static const cinnabar = Color(0xFF9B2B2B);
  static const cinnabarLight = Color(0xFFC04A3A);
  static const bronze = Color(0xFF8C6B3A);
  static const bronzeLight = Color(0xFFB9975B);
  static const bamboo = Color(0xFF3E544A);
  static const bambooLight = Color(0xFF6E8F7E);

  // 暗色基准
  static const _inkDark = Color(0xFF0E0B08);
  static const _inkCardDark = Color(0xFF171310);
  static const _inkSoftDark = Color(0xFF2B2620);
  static const _paperDark = Color(0xFFF2EAD8);
  static const _paperDimDark = Color(0xFFC9BFA6);

  // 亮色基准（纸底墨字）
  static const _inkLight = Color(0xFFF2EAD8);
  static const _inkCardLight = Color(0xFFF9F2E4);
  static const _inkSoftLight = Color(0xFFEAE1CC);
  static const _paperLight = Color(0xFF262019);
  static const _paperDimLight = Color(0xFF6F6654);

  /// 主题明暗变化时同步语义色（由根组件在构建 MaterialApp 前调用）。
  static void applyBrightness(Brightness b) {
    if (b == Brightness.dark) {
      ink = _inkDark;
      inkCard = _inkCardDark;
      inkSoft = _inkSoftDark;
      paper = _paperDark;
      paperDim = _paperDimDark;
    } else {
      ink = _inkLight;
      inkCard = _inkCardLight;
      inkSoft = _inkSoftLight;
      paper = _paperLight;
      paperDim = _paperDimLight;
    }
  }

  static ThemeData get dark => _build(
        brightness: Brightness.dark,
        scaffold: _inkDark,
        card: _inkCardDark,
        soft: _inkSoftDark,
        fg: _paperDark,
        fgDim: _paperDimDark,
        secondary: bronzeLight,
      );

  static ThemeData get light => _build(
        brightness: Brightness.light,
        scaffold: _inkLight,
        card: _inkCardLight,
        soft: _inkSoftLight,
        fg: _paperLight,
        fgDim: _paperDimLight,
        secondary: bronze,
      );

  static ThemeData _build({
    required Brightness brightness,
    required Color scaffold,
    required Color card,
    required Color soft,
    required Color fg,
    required Color fgDim,
    required Color secondary,
  }) =>
      ThemeData(
        useMaterial3: true,
        brightness: brightness,
        scaffoldBackgroundColor: scaffold,
        fontFamily: 'Noto Sans SC',
        colorScheme: ColorScheme(
          brightness: brightness,
          primary: cinnabar,
          onPrimary: _paperDark, // 朱砂底上始终用浅色字
          secondary: secondary,
          onSecondary: brightness == Brightness.dark ? _inkDark : _paperDark,
          surface: card,
          onSurface: fg,
          error: cinnabarLight,
          onError: _paperDark,
          outline: fgDim.withValues(alpha: 0.2),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: scaffold.withValues(alpha: 0.85),
          foregroundColor: fg,
          elevation: 0,
          centerTitle: false,
          titleTextStyle: TextStyle(
            color: fg,
            fontSize: 18,
            fontFamily: 'Noto Sans SC',
            fontWeight: FontWeight.w600,
            letterSpacing: 4,
          ),
        ),
        cardTheme: CardThemeData(
          color: card,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(3),
            side: BorderSide(color: fgDim.withValues(alpha: 0.15)),
          ),
          margin: EdgeInsets.zero,
        ),
        dividerColor: fgDim.withValues(alpha: 0.15),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: scaffold,
          hintStyle: TextStyle(
            color: fgDim.withValues(alpha: 0.5),
            fontFamily: 'Noto Sans SC',
          ),
          labelStyle: TextStyle(
            color: fgDim,
            letterSpacing: 2,
            fontFamily: 'Noto Sans SC',
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: BorderSide(color: fgDim.withValues(alpha: 0.25)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: BorderSide(color: fgDim.withValues(alpha: 0.25)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(3),
            borderSide: BorderSide(color: secondary),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: cinnabar.withValues(alpha: 0.9),
            foregroundColor: _paperDark,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
            textStyle: const TextStyle(
              letterSpacing: 4,
              fontSize: 14,
              fontFamily: 'Noto Sans SC',
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: fgDim,
            side: BorderSide(color: fgDim.withValues(alpha: 0.3)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
            textStyle: const TextStyle(
              letterSpacing: 4,
              fontSize: 14,
              fontFamily: 'Noto Sans SC',
            ),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: soft,
          side: BorderSide(color: fgDim.withValues(alpha: 0.25)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(3)),
          labelStyle: TextStyle(
            color: fgDim,
            fontSize: 12,
            fontFamily: 'Noto Sans SC',
          ),
        ),
        snackBarTheme: const SnackBarThemeData(
          backgroundColor: _inkSoftDark,
          contentTextStyle: TextStyle(
            color: _paperDark,
            fontFamily: 'Noto Sans SC',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
}
