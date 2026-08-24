import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import '../widgets/traitor_card.dart';
import 'traitor_detail_screen.dart';

const _periods = ['全部', '宋末', '明末', '清末', '民国', '其他'];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _nameCtrl = TextEditingController();
  final _yearFromCtrl = TextEditingController();
  final _yearToCtrl = TextEditingController();

  TraitorStats? _stats;
  List<TimelineNode> _timeline = [];
  List<Traitor> _traitors = [];
  String _period = '全部';
  bool _loading = true;
  bool _searching = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _yearFromCtrl.dispose();
    _yearToCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        ApiClient.instance.getStats(),
        ApiClient.instance.getTimeline(),
        ApiClient.instance.listTraitors(),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = results[0] as TraitorStats;
        _timeline = results[1] as List<TimelineNode>;
        _traitors = results[2] as List<Traitor>;
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

  Future<void> _search() async {
    FocusScope.of(context).unfocus();
    setState(() => _searching = true);
    try {
      final items = await ApiClient.instance.listTraitors(
        name: _nameCtrl.text.trim(),
        yearFrom: int.tryParse(_yearFromCtrl.text.trim()),
        yearTo: int.tryParse(_yearToCtrl.text.trim()),
        period: _period == '全部' ? null : _period,
      );
      if (!mounted) return;
      setState(() {
        _traitors = items;
        _searching = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _searching = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
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
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      _statsBoard(),
                      SectionHeader(title: '三维检索', en: 'SEARCH'),
                      _searchPanel(),
                      SectionHeader(title: '人物卡片墙', en: 'FIGURES'),
                      _cardWall(),
                      if (_timeline.isNotEmpty) ...[
                        SectionHeader(title: '重大事件时间线', en: 'TIMELINE'),
                        _timelineView(),
                      ],
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  Widget _statsBoard() {
    final s = _stats;
    final cells = [
      ('档案总数', s?.total ?? 0),
      ('被判刑', s?.sentenced ?? 0),
      ('子女信息', s?.childrenInfo ?? 0),
      ('后代现状', s?.descendantsStatus ?? 0),
    ];
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
                            fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.bronzeLight)),
                    const SizedBox(height: 4),
                    Text(label,
                        style: TextStyle(fontSize: 11, letterSpacing: 2, color: AppTheme.paperDim)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _searchPanel() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: '姓名检索',
                hintText: '按人物姓名模糊匹配',
                prefixIcon: Icon(Icons.search),
              ),
              onSubmitted: (_) => _search(),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _yearFromCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: '年份从', hintText: '如 1937'),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text('—', style: TextStyle(color: AppTheme.paperDim)),
                ),
                Expanded(
                  child: TextField(
                    controller: _yearToCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: '年份至', hintText: '如 1945'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  for (final p in _periods)
                    ChoiceChip(
                      label: Text(p),
                      selected: _period == p,
                      selectedColor: AppTheme.cinnabar.withValues(alpha: 0.5),
                      labelStyle: TextStyle(
                          color: _period == p ? AppTheme.paper : AppTheme.paperDim, fontSize: 12),
                      side: BorderSide(
                          color: _period == p
                              ? AppTheme.cinnabarLight
                              : AppTheme.paperDim.withValues(alpha: 0.25)),
                      onSelected: (_) => setState(() => _period = p),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _searching ? null : _search,
                child: Text(_searching ? '检索中…' : '检 索'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cardWall() {
    if (_traitors.isEmpty) return const EmptyView(text: '没有符合条件的人物');
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 240,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: _traitors.length,
      itemBuilder: (_, i) => TraitorCard(
        traitor: _traitors[i],
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => TraitorDetailScreen(traitorId: _traitors[i].id),
        )),
      ),
    );
  }

  Widget _timelineView() {
    final nodes = [..._timeline]..sort((a, b) => (a.year ?? 0).compareTo(b.year ?? 0));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            for (final (i, n) in nodes.indexed)
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SizedBox(
                      width: 56,
                      child: Align(
                        alignment: Alignment.topCenter,
                        child: Text('${n.year ?? '不详'}',
                            style: TextStyle(fontSize: 13, color: AppTheme.bronzeLight)),
                      ),
                    ),
                    Column(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.cinnabar, width: 2),
                            color: AppTheme.ink,
                          ),
                        ),
                        if (i < nodes.length - 1)
                          Expanded(child: Container(width: 1.5, color: AppTheme.cinnabar.withValues(alpha: 0.4))),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 20, right: 4),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.event,
                                style: TextStyle(fontSize: 13, height: 1.5, color: AppTheme.paper.withValues(alpha: 0.9))),
                            if (n.traitorName != null)
                              Text('关联：${n.traitorName}',
                                  style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7))),
                          ],
                        ),
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
}
