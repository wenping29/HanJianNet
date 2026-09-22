import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import '../widgets/traitor_card.dart';
import 'search_screen.dart';
import 'traitor_detail_screen.dart';
import 'traitor_map_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _scrollCtrl = ScrollController();

  TraitorStats? _stats;
  List<Traitor> _traitors = [];
  /// Keyset 游标：null 表示没有下一页；首屏用空串请求第一页。
  String? _nextCursor = '';
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAll();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200 &&
        !_loadingMore &&
        _nextCursor != null) {
      _loadMore();
    }
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.getStats(),
        ApiClient.instance.listTraitors(cursor: '', pageSize: 20),
      ]);
      if (!mounted) return;
      final paginated = results[1] as PaginatedTraitors;
      setState(() {
        _stats = results[0] as TraitorStats;
        _traitors = paginated.items;
        _nextCursor = paginated.nextCursor;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    final cursor = _nextCursor;
    if (_loadingMore || cursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final result = await ApiClient.instance.listTraitors(cursor: cursor, pageSize: 20);
      if (!mounted) return;
      setState(() {
        _traitors = [..._traitors, ...result.items];
        _nextCursor = result.nextCursor;
        _loadingMore = false;
      });
    } on ApiException catch (_) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.archives)),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorRetry(message: _error!, onRetry: _loadAll)
              : RefreshIndicator(
                  color: AppTheme.bronzeLight,
                  onRefresh: _loadAll,
                  child: CustomScrollView(
                    controller: _scrollCtrl,
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                          child: _statsBoard(),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: SectionHeader(title: l10n.figures, en: 'FIGURES'),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        sliver: SliverGrid(
                          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 220,
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                            childAspectRatio: 0.72,
                          ),
                          delegate: SliverChildBuilderDelegate(
                            (context, i) {
                              if (i >= _traitors.length) {
                                return const Center(
                                    child:
                                        CircularProgressIndicator(color: AppTheme.bronzeLight));
                              }
                              final t = _traitors[i];
                              return TraitorCard(
                                traitor: t,
                                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                                  builder: (_) =>
                                      TraitorDetailScreen(traitorId: t.id),
                                )),
                              );
                            },
                            childCount: _traitors.length + (_loadingMore ? 1 : 0),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  /// 点击统计数字跳转到查询页：总数不带条件，时期按对应时期筛选，均立即查询。
  void _openSearch({String? period}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) =>
          period == null ? const SearchScreen(autoSearch: true) : SearchScreen(initialPeriod: period),
    ));
  }

  Widget _statsBoard() {
    final l10n = AppLocalizations.of(context)!;
    final s = _stats;
    // (标签, 数量, 时期筛选值)；总数项时期为 null 表示不带条件
    final cells = [
      (l10n.totalArchives, s?.total ?? 0, null as String?),
    ];
    final periods = s?.periods;
    if (periods != null) {
      for (final entry in periods.entries) {
        cells.add((entry.key, entry.value, entry.key));
      }
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Row(
          children: [
            for (final (i, (label, value, period)) in cells.indexed) ...[
              if (i > 0) VerticalDivider(color: AppTheme.paperDim.withValues(alpha: 0.15)),
              Expanded(
                child: InkWell(
                  onTap: () => _openSearch(period: period),
                  child: Column(
                    children: [
                      Text('$value',
                          style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.bronzeLight)),
                      const SizedBox(height: 4),
                      Text(label,
                          style: TextStyle(
                              fontSize: 11, letterSpacing: 2, color: AppTheme.paperDim)),
                    ],
                  ),
                ),
              ),
            ],
            VerticalDivider(color: AppTheme.paperDim.withValues(alpha: 0.15)),
            Expanded(
              child: InkWell(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const TraitorMapScreen(),
                )),
                child: Column(
                  children: [
                    const Icon(Icons.map_outlined, size: 26, color: AppTheme.bronzeLight),
                    const SizedBox(height: 4),
                    Text(l10n.traitorMap,
                        style: TextStyle(
                            fontSize: 11, letterSpacing: 2, color: AppTheme.paperDim)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}