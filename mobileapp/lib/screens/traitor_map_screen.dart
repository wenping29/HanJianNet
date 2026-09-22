import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/china_map.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import 'search_screen.dart';

/// 汉奸地图页：分省数量分布地图 + 省份排行，点选省份跳转查询结果。
class TraitorMapScreen extends StatefulWidget {
  const TraitorMapScreen({super.key});

  @override
  State<TraitorMapScreen> createState() => _TraitorMapScreenState();
}

class _TraitorMapScreenState extends State<TraitorMapScreen> {
  ChinaMapData? _mapData;
  ProvinceStatsResult? _stats;
  String? _error; // null=加载中；''=非接口异常（显示通用网络错误文案）
  String? _selectedFull;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _mapData = null;
      _stats = null;
      _selectedFull = null;
    });
    try {
      final results = await Future.wait([
        ChinaMapData.load(),
        ApiClient.instance.getProvinceStats(),
      ]);
      if (!mounted) return;
      setState(() {
        _mapData = results[0] as ChinaMapData;
        _stats = results[1] as ProvinceStatsResult;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.traitorMap)),
      body: _body(l10n),
    );
  }

  Widget _body(AppLocalizations l10n) {
    if (_error != null) {
      return ErrorRetry(message: _error!.isEmpty ? l10n.networkError : _error!, onRetry: _load);
    }
    final mapData = _mapData;
    final stats = _stats;
    if (mapData == null || stats == null) return const LoadingView();

    final countByName = {for (final s in stats.items) s.fullName: s.count};
    final maxCount = stats.items.fold(1, (m, s) => s.count > m ? s.count : m);
    ProvinceStat? selected;
    for (final s in stats.items) {
      if (s.fullName == _selectedFull) selected = s;
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Card(
            clipBehavior: Clip.antiAlias,
            child: SizedBox(
              height: 300,
              child: InteractiveViewer(
                maxScale: 6,
                child: ChinaMap(
                  data: mapData,
                  countByName: countByName,
                  selectedName: _selectedFull,
                  onProvinceTap: (p) => setState(() {
                    _selectedFull = _selectedFull == p.name ? null : p.name;
                  }),
                ),
              ),
            ),
          ),
        ),
        if (selected != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
            child: Card(
              child: ListTile(
                title: Text(selected.fullName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 2)),
                subtitle: Text('${selected.count}',
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.cinnabarLight)),
                trailing: FilledButton.tonal(
                  onPressed: () => _openProvince(selected!.province),
                  child: Text(l10n.viewArchives, style: const TextStyle(fontSize: 13, letterSpacing: 2)),
                ),
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(l10n.mapHint,
                style: TextStyle(fontSize: 12, color: AppTheme.paperDim.withValues(alpha: 0.7))),
          ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            itemCount: stats.items.length,
            itemBuilder: (_, i) {
              final s = stats.items[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: InkWell(
                  onTap: () => _openProvince(s.province),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 26,
                          child: Text('${i + 1}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.bronzeLight.withValues(alpha: 0.7))),
                        ),
                        Text(s.province, style: TextStyle(fontSize: 14, color: AppTheme.paper)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: LinearProgressIndicator(
                            value: s.count / maxCount,
                            minHeight: 4,
                            backgroundColor: AppTheme.inkSoft,
                            color: AppTheme.cinnabar.withValues(alpha: 0.75),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text('${s.count}',
                            style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.cinnabarLight)),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _openProvince(String province) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => SearchScreen(initialProvince: province),
    ));
  }
}
