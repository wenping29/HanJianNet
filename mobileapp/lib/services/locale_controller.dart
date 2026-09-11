import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleController {
  LocaleController._();
  static final LocaleController instance = LocaleController._();

  static const _kLocale = 'hanjian.locale';

  static const supportedLocales = [
    Locale('zh'),
    Locale('en'),
    Locale('de'),
    Locale('fr'),
    Locale('ru'),
    Locale('ja'),
    Locale('es'),
    Locale('ko'),
  ];

  static const localeNames = {
    'zh': '中文',
    'en': 'English',
    'de': 'Deutsch',
    'fr': 'Français',
    'ru': 'Русский',
    'ja': '日本語',
    'es': 'Español',
    'ko': '한국어',
  };

  final ValueNotifier<Locale> locale = ValueNotifier(const Locale('zh'));

  String localeName(String code) => localeNames[code] ?? code;

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    final code = sp.getString(_kLocale);
    if (code != null) {
      locale.value = Locale(code);
    }
  }

  Future<void> setLocale(Locale loc) async {
    locale.value = loc;
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_kLocale, loc.languageCode);
  }
}