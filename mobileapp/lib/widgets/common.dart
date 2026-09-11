import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../widgets/theme.dart';

String formatYear(BuildContext context, int? year, String type) {
  final l10n = AppLocalizations.of(context)!;
  if (type == 'unknown' || year == null) return l10n.unknown;
  final prefix = type == 'circa' ? l10n.circa : '';
  final suffix = type == 'before' ? l10n.before : type == 'after' ? l10n.after : '';
  return '$prefix$year$suffix';
}

String formatLifeSpan(BuildContext context, Traitor t) =>
    '${formatYear(context, t.birthYear, t.birthYearType)} — ${formatYear(context, t.deathYear, t.deathYearType)}';

String formatDateTime(String? iso) {
  if (iso == null || iso.isEmpty) return '—';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  String p(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${p(d.month)}-${p(d.day)} ${p(d.hour)}:${p(d.minute)}';
}

/// 审核状态徽标。
class StatusChip extends StatelessWidget {
  final String status;

  const StatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final (label, color) = switch (status) {
      'approved' => (l10n.approved, AppTheme.bambooLight),
      'rejected' => (l10n.rejected, AppTheme.cinnabarLight),
      _ => (l10n.pending, AppTheme.bronzeLight),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        border: Border.all(color: color.withValues(alpha: 0.6)),
        borderRadius: BorderRadius.circular(3),
        color: color.withValues(alpha: 0.15),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, letterSpacing: 1, color: color)),
    );
  }
}

/// 章节标题：左侧朱砂竖线 + 中文标题 + 英文小字。
class SectionHeader extends StatelessWidget {
  final String title;
  final String en;

  const SectionHeader({super.key, required this.title, this.en = ''});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Container(width: 3, height: 16, color: AppTheme.cinnabar),
          const SizedBox(width: 10),
          Text(title,
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w600, letterSpacing: 4, color: AppTheme.paper)),
          if (en.isNotEmpty) ...[
            const SizedBox(width: 10),
            Text(en,
                style: TextStyle(
                    fontSize: 11, fontStyle: FontStyle.italic, color: AppTheme.bronzeLight)),
          ],
        ],
      ),
    );
  }
}

/// 加载失败视图（带重试）。
class ErrorRetry extends StatelessWidget {
  final String message;
  final Future<void> Function() onRetry;

  const ErrorRetry({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, style: const TextStyle(color: AppTheme.cinnabarLight)),
          const SizedBox(height: 16),
          OutlinedButton(onPressed: onRetry, child: Text(l10n.retry)),
        ],
      ),
    );
  }
}

/// 空数据视图。
class EmptyView extends StatelessWidget {
  final String text;

  const EmptyView({super.key, this.text = ''});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Text(text.isEmpty ? l10n.noRecords : text,
            style: TextStyle(color: AppTheme.paperDim.withValues(alpha: 0.6))),
      ),
    );
  }
}

/// 圆形加载指示。
class LoadingView extends StatelessWidget {
  const LoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator(color: AppTheme.bronzeLight));
  }
}