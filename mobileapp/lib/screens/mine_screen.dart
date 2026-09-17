import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/theme.dart';
import 'avatar_screen.dart';
import 'login_screen.dart';
import 'my_submissions_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class MineScreen extends StatefulWidget {
  const MineScreen({super.key});

  @override
  State<MineScreen> createState() => _MineScreenState();
}

class _MineScreenState extends State<MineScreen> {
  int _unreadNotifications = 0;

  @override
  void initState() {
    super.initState();
    _loadUnread();
  }

  /// 拉取未读通知数用于入口角标；未登录或请求失败时静默忽略。
  Future<void> _loadUnread() async {
    if (!Session.instance.isLogin) return;
    try {
      final res = await ApiClient.instance.myNotifications();
      if (!mounted) return;
      setState(() => _unreadNotifications = res.unreadCount);
    } on ApiException catch (_) {}
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
            onPressed: () => _goLogin(),
            child: Text(l10n.goToLogin),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => _goLogin(),
            child: Text(l10n.register),
          ),
        ],
      ),
    );
  }

  Future<void> _goLogin() async {
    final ok = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
    if (ok == true) {
      setState(() {});
    }
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
                GestureDetector(
                  onTap: () async {
                    final updated = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(builder: (_) => const EditAvatarScreen()),
                    );
                    if (updated == true) setState(() {});
                  },
                  child: CircleAvatar(
                    radius: 26,
                    backgroundColor: AppTheme.cinnabar.withValues(alpha: 0.3),
                    backgroundImage: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
                        ? NetworkImage(resolveAssetUrl(user.avatarUrl!))
                        : null,
                    child: (user?.avatarUrl == null || user!.avatarUrl!.isEmpty)
                        ? Text(
                            (user?.username.isNotEmpty == true)
                                ? user!.username.characters.first.toUpperCase()
                                : '?',
                            style: const TextStyle(fontSize: 20, color: AppTheme.paper),
                          )
                        : null,
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
            leading: const Icon(Icons.person_outline, color: AppTheme.cinnabarLight),
            title: Text(l10n.editProfile, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () async {
              final updated = await Navigator.of(context).push<bool>(MaterialPageRoute(
                builder: (_) => const EditProfileScreen(),
              ));
              if (updated == true) setState(() {});
            },
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.history_edu, color: AppTheme.cinnabarLight),
            title: Text(l10n.mySubmissions, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const MySubmissionsScreen(),
              ));
            },
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.notifications_outlined, color: AppTheme.cinnabarLight),
            title: Text(l10n.notifications, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_unreadNotifications > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.cinnabarLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      _unreadNotifications > 99 ? '99+' : '$_unreadNotifications',
                      style: const TextStyle(fontSize: 11, color: AppTheme.paper),
                    ),
                  ),
                const SizedBox(width: 4),
                const Icon(Icons.chevron_right, size: 20),
              ],
            ),
            onTap: () async {
              await Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const NotificationsScreen(),
              ));
              _loadUnread();
            },
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.settings_outlined, color: AppTheme.cinnabarLight),
            title: Text(l10n.settings, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            trailing: const Icon(Icons.chevron_right, size: 20),
            onTap: () {
              Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const SettingsScreen(),
              ));
            },
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.logout, color: AppTheme.cinnabarLight),
            title: Text(l10n.logout, style: const TextStyle(fontSize: 15, letterSpacing: 2)),
            onTap: () async {
              await Session.instance.logout();
              if (!mounted) return;
              setState(() {});
            },
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}
