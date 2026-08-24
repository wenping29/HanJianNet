import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<Revision>? _submissions;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
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
    final user = Session.instance.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('个人中心'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20),
            tooltip: 'API 设置',
            onPressed: () => showApiSettingsDialog(context),
          ),
        ],
      ),
      body: !Session.instance.isLogin
          ? _notLogin()
          : ListView(
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
                            (user?.username.isNotEmpty == true) ? user!.username.characters.first.toUpperCase() : '?',
                            style: const TextStyle(fontSize: 20, color: AppTheme.paper),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user?.username ?? '',
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: 1)),
                              const SizedBox(height: 4),
                              Text(user?.email ?? '', style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
                            ],
                          ),
                        ),
                        OutlinedButton(
                          onPressed: () async {
                            await Session.instance.logout();
                            if (!mounted) return;
                            setState(() {});
                          },
                          child: const Text('退出'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SectionHeader(title: '我的提交记录', en: 'MY SUBMISSIONS'),
                _submissionsView(),
              ],
            ),
    );
  }

  Widget _notLogin() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.person_outline, size: 56, color: AppTheme.paperDim.withValues(alpha: 0.4)),
            const SizedBox(height: 12),
            Text('登录后可查看本人提交记录与审核状态',
                style: TextStyle(color: AppTheme.paperDim, fontSize: 13)),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () async {
                final ok = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
                if (ok == true) setState(() {});
              },
              child: const Text('去登录'),
            ),
          ],
        ),
      );

  Widget _submissionsView() {
    if (_error != null) return ErrorRetry(message: _error!, onRetry: _load);
    final items = _submissions;
    if (items == null) return const LoadingView();
    if (items.isEmpty) return const EmptyView(text: '还没有提交过档案或修改');
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
                            color: r.isNewArchive ? AppTheme.cinnabarLight : AppTheme.paperDim.withValues(alpha: 0.3),
                          ),
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: Text(r.isNewArchive ? '新建档案' : '修改档案',
                            style: TextStyle(
                                fontSize: 10,
                                color: r.isNewArchive ? AppTheme.cinnabarLight : AppTheme.paperDim)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(r.payload.name,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 2)),
                      ),
                      StatusChip(status: r.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('修改内容：${r.changeSummary}',
                      style: TextStyle(fontSize: 12.5, height: 1.5, color: AppTheme.paper.withValues(alpha: 0.85))),
                  const SizedBox(height: 6),
                  Text('提交于 ${formatDateTime(r.submittedAt)}',
                      style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7))),
                  if (r.reviewedAt != null)
                    Text(
                      '审核于 ${formatDateTime(r.reviewedAt)}'
                      '${r.reviewer != null ? ' · 审核人：${r.reviewer!.username}' : ''}'
                      '${r.reviewComment?.isNotEmpty == true ? ' · 意见：${r.reviewComment}' : ''}',
                      style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7)),
                    ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
