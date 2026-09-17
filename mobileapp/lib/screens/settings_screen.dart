import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../services/locale_controller.dart';
import '../widgets/theme.dart';

/// 设置页：语言等应用级偏好。
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.language, color: AppTheme.cinnabarLight),
              title: Text(l10n.language, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
              trailing: const Icon(Icons.chevron_right, size: 20),
              onTap: () => _showLanguagePicker(context),
            ),
          ),
        ],
      ),
    );
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
