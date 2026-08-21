import 'package:flutter/material.dart';

import '../models/models.dart';
import '../widgets/theme.dart';

/// 首页人物卡片墙的卡片。
class TraitorCard extends StatelessWidget {
  final Traitor traitor;
  final VoidCallback onTap;

  const TraitorCard({super.key, required this.traitor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = traitor;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: t.photoUrl != null
                  ? Image.network(
                      t.photoUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _placeholder(t.name),
                    )
                  : _placeholder(t.name),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          t.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 2, color: AppTheme.paper),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.cinnabar.withValues(alpha: 0.7)),
                          borderRadius: BorderRadius.circular(3),
                          color: AppTheme.cinnabar.withValues(alpha: 0.15),
                        ),
                        child: Text(t.period,
                            style: const TextStyle(fontSize: 10, color: AppTheme.cinnabarLight)),
                      ),
                    ],
                  ),
                  if (t.faction.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(t.faction,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: AppTheme.bronzeLight)),
                    ),
                  if (t.identityTags.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        t.identityTags.take(3).join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.8)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder(String name) => Container(
        color: AppTheme.inkSoft,
        alignment: Alignment.center,
        child: Text(
          name.isEmpty ? '？' : name.characters.first,
          style: TextStyle(
              fontSize: 40, fontWeight: FontWeight.bold, color: AppTheme.paperDim.withValues(alpha: 0.2)),
        ),
      );
}
