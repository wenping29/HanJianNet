import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 主题模式控制器：跟随系统 / 黑夜 / 白天，持久化到 SharedPreferences。
class ThemeController {
  ThemeController._();
  static final ThemeController instance = ThemeController._();

  static const _kThemeMode = 'hanjian.themeMode';

  final ValueNotifier<ThemeMode> mode = ValueNotifier(ThemeMode.system);

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    final v = sp.getString(_kThemeMode);
    mode.value = switch (v) {
      'dark' => ThemeMode.dark,
      'light' => ThemeMode.light,
      _ => ThemeMode.system,
    };
  }

  Future<void> setMode(ThemeMode m) async {
    mode.value = m;
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_kThemeMode, m.name);
  }
}
