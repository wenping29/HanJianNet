import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/locale_controller.dart';
import '../services/session.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import 'login_screen.dart';

class MineScreen extends StatefulWidget {
  const MineScreen({super.key});

  @override
  State<MineScreen> createState() => _MineScreenState();
}

class _MineScreenState extends State<MineScreen> {
  List<Revision>? _submissions;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!Session.instance.isLogin) return;
    setState(() {
      _error = null;
      _submissions = null;
    });
    try {
      final items = await ApiClient.instance.mySubmissions();
      if (!mounted) return;
      setState(() => _submissions = items);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final user = Session.instance.user;
    final isLogin = Session.instance.isLogin;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.navMine)),
      body: !isLogin ? _notLogin() : _loggedInView(user),
    );
  }

  Widget _notLogin() {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.person_outline, size: 56, color: AppTheme.paperDim.withValues(alpha: 0.4)),
          const SizedBox(height: 12),
          Text(l10n.loginForSubmissions,
              style: TextStyle(color: AppTheme.paperDim, fontSize: 13)),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () async {
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
              if (ok == true) {
                setState(() {});
                _load();
              }
            },
            child: Text(l10n.goToLogin),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
              );
              if (ok == true) {
                setState(() {});
                _load();
              }
            },
            child: Text(l10n.register),
          ),
        ],
      ),
    );
  }

  Widget _loggedInView(User? user) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppTheme.cinnabar.withValues(alpha: 0.3),
                  child: Text(
                    (user?.username.isNotEmpty == true)
                        ? user!.username.characters.first.toUpperCase()
                        : '?',
                    style: const TextStyle(fontSize: 20, color: AppTheme.paper),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.username ?? '',
                          style: const TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(user?.role ?? '',
                          style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
                      const SizedBox(height: 2),
                      Text(user?.email ?? '',
                          style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: Icon(Icons.add_circle_outline, color: AppTheme.cinnabarLight),
            title: Text(l10n.submitNewArchive, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('P1 阶段实现')),
              );
            },
          ),
        ),
        SectionHeader(title: l10n.mySubmissions, en: 'MY SUBMISSIONS'),
        _submissionsView(),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.language, color: AppTheme.cinnabarLight),
            title: Text(l10n.language, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: _showLanguagePicker,
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.logout, color: AppTheme.cinnabarLight),
            title: Text(l10n.logout, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            onTap: () async {
              await Session.instance.logout();
              if (!mounted) return;
              setState(() {
                _submissions = null;
              });
            },
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Future<void> _showLanguagePicker() async {
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

  Widget _submissionsView() {
    final l10n = AppLocalizations.of(context)!;
    if (_error != null) return ErrorRetry(message: _error!, onRetry: _load);
    final items = _submissions;
    if (items == null) return const LoadingView();
    if (items.isEmpty) return EmptyView(text: l10n.noSubmissions);
    return Column(
      children: [
        for (final r in items)
          Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: r.isNewArchive
                                ? AppTheme.cinnabarLight
                                : AppTheme.paperDim.withValues(alpha: 0.3),
                          ),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(r.isNewArchive ? l10n.submitNewArchive : l10n.modifyArchive,
                            style: TextStyle(
                                fontSize: 10,
                                color: r.isNewArchive
                                    ? AppTheme.cinnabarLight
                                    : AppTheme.paperDim)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(r.payload.name,
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 2)),
                      ),
                      StatusChip(status: r.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(l10n.changeContent(r.changeSummary),
                      style: TextStyle(
                          fontSize: 12.5, height: 1.5, color: AppTheme.paper.withValues(alpha: 0.85))),
                  const SizedBox(height: 6),
                  Text(l10n.submittedAt(formatDateTime(r.submittedAt)),
                      style:
                          TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7))),
                  if (r.reviewedAt != null)
                    Text(
                      l10n.reviewedAt(formatDateTime(r.reviewedAt)) +
                          (r.reviewer != null ? l10n.reviewer(r.reviewer!.username) : '') +
                          (r.reviewComment?.isNotEmpty == true ? l10n.reviewComment(r.reviewComment!) : ''),
                      style:
                          TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7)),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}