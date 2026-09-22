import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../services/locale_controller.dart';
import '../services/theme_controller.dart';
import '../widgets/theme.dart';

/// 设置页：语言、主题等应用级偏好。
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings)),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.language, color: AppTheme.cinnabarLight),
              title: Text(l10n.language, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: () => _showLanguagePicker(context),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.brightness_6_outlined, color: AppTheme.cinnabarLight),
              title: Text(l10n.theme, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: () => _showThemePicker(context),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showThemePicker(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    final current = ThemeController.instance.mode.value;
    final options = [
      (ThemeMode.system, l10n.themeSystem),
      (ThemeMode.dark, l10n.themeDark),
      (ThemeMode.light, l10n.themeLight),
    ];
    final chosen = await showDialog<ThemeMode>(
      context: context,
      builder: (ctx) => SimpleDialog(
        backgroundColor: AppTheme.inkCard,
        title: Text(
          AppLocalizations.of(ctx)!.chooseTheme,
          style: const TextStyle(fontSize: 16, letterSpacing: 2),
        ),
        children: [
          RadioGroup<ThemeMode>(
            groupValue: current,
            onChanged: (v) => Navigator.of(ctx).pop(v),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final (mode, label) in options)
                  RadioListTile<ThemeMode>(
                    value: mode,
                    activeColor: AppTheme.cinnabar,
                    title: Text(label, style: const TextStyle(fontSize: 14)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
    if (chosen != null) {
      await ThemeController.instance.setMode(chosen);
    }
  }

  Future<void> _showLanguagePicker(BuildContext context) async {
    final current = LocaleController.instance.locale.value;
    final chosen = await showDialog<Locale>(
      context: context,
      builder: (ctx) => SimpleDialog(
        backgroundColor: AppTheme.inkCard,
        title: Text(
          AppLocalizations.of(ctx)!.chooseLanguage,
          style: const TextStyle(fontSize: 16, letterSpacing: 2),
        ),
        children: [
          RadioGroup<Locale>(
            groupValue: current,
            onChanged: (v) => Navigator.of(ctx).pop(v),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final loc in LocaleController.supportedLocales)
                  RadioListTile<Locale>(
                    value: loc,
                    activeColor: AppTheme.cinnabar,
                    title: Text(
                      LocaleController.instance.localeName(loc.languageCode),
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
    if (chosen != null) {
      await LocaleController.instance.setLocale(chosen);
    }
  }
}
