import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';

/// 我的提交记录页：展示本人提交的档案/修订及审核状态。
class MySubmissionsScreen extends StatefulWidget {
  const MySubmissionsScreen({super.key});

  @override
  State<MySubmissionsScreen> createState() => _MySubmissionsScreenState();
}

class _MySubmissionsScreenState extends State<MySubmissionsScreen> {
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
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.mySubmissionsTitle)),
      body: _body(l10n),
    );
  }

  Widget _body(AppLocalizations l10n) {
    if (_error != null) return ErrorRetry(message: _error!, onRetry: _load);
    final items = _submissions;
    if (items == null) return const LoadingView();
    if (items.isEmpty) return EmptyView(text: l10n.noSubmissions);
    return RefreshIndicator(
      color: AppTheme.bronzeLight,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          for (final r in items) _submissionCard(l10n, r),
        ],
      ),
    );
  }

  Widget _submissionCard(AppLocalizations l10n, Revision r) {
    return Card(
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
    );
  }
}
