import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';

/// 通知消息页：展示审核结果等站内通知，点击单条或右上角按钮标记已读。
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NoticeItem>? _items;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _items = null;
    });
    try {
      final res = await ApiClient.instance.myNotifications();
      if (!mounted) return;
      setState(() => _items = res.items);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  bool get _hasUnread => _items?.any((n) => !n.isRead) ?? false;

  Future<void> _markAllRead() async {
    try {
      await ApiClient.instance.markAllNotificationsRead();
      if (!mounted) return;
      setState(() {
        _items = [for (final n in _items!) n.copyWith(isRead: true)];
      });
    } on ApiException catch (_) {}
  }

  Future<void> _markRead(NoticeItem n) async {
    if (n.isRead) return;
    // 先本地置为已读，再静默同步服务端
    setState(() {
      _items = [
        for (final x in _items!) x.id == n.id ? x.copyWith(isRead: true) : x,
      ];
    });
    try {
      await ApiClient.instance.markNotificationRead(n.id);
    } on ApiException catch (_) {}
  }

  String _title(AppLocalizations l10n, NoticeItem n) {
    return switch (n.type) {
      'revision_approved' => l10n.notificationApproved(n.referenceName),
      'revision_rejected' => l10n.notificationRejected(n.referenceName),
      _ => n.referenceName,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifications),
        actions: [
          if (_hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: Text(l10n.markAllRead,
                  style: const TextStyle(fontSize: 13, letterSpacing: 1)),
            ),
        ],
      ),
      body: _body(l10n),
    );
  }

  Widget _body(AppLocalizations l10n) {
    if (_error != null) return ErrorRetry(message: _error!, onRetry: _load);
    final items = _items;
    if (items == null) return const LoadingView();
    if (items.isEmpty) return EmptyView(text: l10n.noNotifications);
    return RefreshIndicator(
      color: AppTheme.bronzeLight,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          for (final n in items) _noticeCard(l10n, n),
        ],
      ),
    );
  }

  Widget _noticeCard(AppLocalizations l10n, NoticeItem n) {
    final isApproved = n.type == 'revision_approved';
    final iconColor = isApproved ? AppTheme.bambooLight : AppTheme.cinnabarLight;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _markRead(n),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isApproved ? Icons.check_circle_outline : Icons.cancel_outlined,
                size: 22,
                color: iconColor,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _title(l10n, n),
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.5,
                        letterSpacing: 1,
                        fontWeight: n.isRead ? FontWeight.normal : FontWeight.w600,
                        color: n.isRead
                            ? AppTheme.paper.withValues(alpha: 0.6)
                            : AppTheme.paper,
                      ),
                    ),
                    if (n.comment?.isNotEmpty == true) ...[
                      const SizedBox(height: 4),
                      Text(n.comment!,
                          style: TextStyle(
                              fontSize: 12,
                              height: 1.5,
                              color: AppTheme.paperDim.withValues(alpha: 0.8))),
                    ],
                    const SizedBox(height: 6),
                    Text(formatDateTime(n.createdAt),
                        style: TextStyle(
                            fontSize: 11,
                            color: AppTheme.paperDim.withValues(alpha: 0.7))),
                  ],
                ),
              ),
              if (!n.isRead)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 6, left: 8),
                  decoration: const BoxDecoration(
                    color: AppTheme.cinnabarLight,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
