import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/theme.dart';
import 'register_screen.dart';

/// API 地址设置对话框（移动端 API 地址可配置）。
Future<void> showApiSettingsDialog(BuildContext context) async {
  final ctrl = TextEditingController(text: Session.instance.baseUrl);
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: AppTheme.inkCard,
      title: Text(AppLocalizations.of(ctx)!.apiSettings,
          style: const TextStyle(fontSize: 16, letterSpacing: 2)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(AppLocalizations.of(ctx)!.apiBaseUrlHint,
              style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 12),
          TextField(
            controller: ctrl,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(hintText: 'http://10.0.2.2:3000'),
          ),
        ],
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(AppLocalizations.of(ctx)!.cancel)),
        FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(AppLocalizations.of(ctx)!.save)),
      ],
    ),
  );
  if (ok == true) {
    await Session.instance.updateBaseUrl(ctrl.text);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context)!.saved(Session.instance.baseUrl))),
      );
    }
  }
}

class LoginScreen extends StatefulWidget {
  final String? redirect;

  const LoginScreen({super.key, this.redirect});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _accountCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _accountCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Session.instance.login(_accountCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _busy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.login),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20),
            tooltip: l10n.apiSettings,
            onPressed: () => showApiSettingsDialog(context),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 24),
          Center(
            child: Container(
              width: 64,
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: AppTheme.cinnabar, width: 2),
                borderRadius: BorderRadius.circular(3),
                color: AppTheme.cinnabar.withValues(alpha: 0.15),
              ),
              child: Text(l10n.appLogoText,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, height: 1.2, letterSpacing: 2, color: AppTheme.cinnabarLight)),
            ),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _accountCtrl,
            decoration: InputDecoration(labelText: l10n.emailOrUsername),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordCtrl,
            obscureText: true,
            decoration: InputDecoration(labelText: l10n.password),
            onSubmitted: (_) => _submit(),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_error!, style: const TextStyle(color: AppTheme.cinnabarLight, fontSize: 13)),
            ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? l10n.loggingIn : l10n.loginButton),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _busy
                ? null
                : () async {
                    final navigator = Navigator.of(context);
                    final ok = await navigator.push<bool>(
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    );
                    if (ok == true && mounted) {
                      navigator.pop(true);
                    }
                  },
            child: Text(l10n.noAccount),
          ),
        ],
      ),
    );
  }
}