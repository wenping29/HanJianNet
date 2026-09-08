import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import '../widgets/traitor_card.dart';
import 'traitor_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _scrollCtrl = ScrollController();

  TraitorStats? _stats;
  List<Traitor> _traitors = [];
  int _page = 1;
  int _totalPages = 1;
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
        _page < _totalPages) {
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
        ApiClient.instance.listTraitors(page: 1, pageSize: 20),
      ]);
      if (!mounted) return;
      final paginated = results[1] as PaginatedTraitors;
      setState(() {
        _stats = results[0] as TraitorStats;
        _traitors = paginated.items;
        _page = paginated.page;
        _totalPages = paginated.totalPages;
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
    if (_loadingMore || _page >= _totalPages) return;
    setState(() => _loadingMore = true);
    try {
      final result = await ApiClient.instance.listTraitors(page: _page + 1, pageSize: 20);
      if (!mounted) return;
      setState(() {
        _traitors = [..._traitors, ...result.items];
        _page = result.page;
        _totalPages = result.totalPages;
        _loadingMore = false;
      });
    } on ApiException catch (_) {
      if (!mounted) return;
      setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('汉奸档案')),
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
                      SliverToBoxAdapter(child: _statsBoard()),
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 16, bottom: 12),
                          child: SectionHeader(title: '人物列表', en: 'FIGURES'),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        sliver: SliverGrid(
                          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 220,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
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

  Widget _statsBoard() {
    final s = _stats;
    final cells = [
      ('档案总数', s?.total ?? 0),
    ];
    final periods = s?.periods;
    if (periods != null) {
      for (final entry in periods.entries) {
        cells.add((entry.key, entry.value));
      }
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
        child: Row(
          children: [
            for (final (i, (label, value)) in cells.indexed) ...[
              if (i > 0) VerticalDivider(color: AppTheme.paperDim.withValues(alpha: 0.15)),
              Expanded(
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
            ],
          ],
        ),
      ),
    );
  }
}
