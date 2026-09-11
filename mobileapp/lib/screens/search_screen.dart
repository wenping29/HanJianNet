import 'package:flutter/material.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';
import '../widgets/traitor_card.dart';
import 'traitor_detail_screen.dart';

/// 与 API 对齐的时期值（第一个 null 代表「全部」）。
const _periodApiValues = [null, '宋末', '明末', '清末', '民国', '其他'];

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _nameCtrl = TextEditingController();
  final _yearFromCtrl = TextEditingController();
  final _yearToCtrl = TextEditingController();
  final _eventCtrl = TextEditingController();
  final _nativePlaceCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  List<Traitor> _results = [];
  int _page = 1;
  int _totalPages = 1;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  bool _hasSearched = false;
  int _selectedPeriod = 0;

  @override
  void initState() {
    super.initState();
    _loadAll();
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _yearFromCtrl.dispose();
    _yearToCtrl.dispose();
    _eventCtrl.dispose();
    _nativePlaceCtrl.dispose();
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
      final result = await ApiClient.instance.listTraitors(page: 1, pageSize: 20);
      if (!mounted) return;
      setState(() {
        _results = result.items;
        _page = result.page;
        _totalPages = result.totalPages;
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
    setState(() {
      _loading = true;
      _error = null;
      _hasSearched = true;
    });
    try {
      final result = await ApiClient.instance.listTraitors(
        name: _nameCtrl.text.trim(),
        yearFrom: int.tryParse(_yearFromCtrl.text.trim()),
        yearTo: int.tryParse(_yearToCtrl.text.trim()),
        event: _eventCtrl.text.trim(),
        period: _periodApiValues[_selectedPeriod],
        nativePlace: _nativePlaceCtrl.text.trim(),
        page: 1,
        pageSize: 20,
      );
      if (!mounted) return;
      setState(() {
        _results = result.items;
        _page = result.page;
        _totalPages = result.totalPages;
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
      final result = await ApiClient.instance.listTraitors(
        name: _nameCtrl.text.trim(),
        yearFrom: int.tryParse(_yearFromCtrl.text.trim()),
        yearTo: int.tryParse(_yearToCtrl.text.trim()),
        event: _eventCtrl.text.trim(),
        period: _periodApiValues[_selectedPeriod],
        nativePlace: _nativePlaceCtrl.text.trim(),
        page: _page + 1,
        pageSize: 20,
      );
      if (!mounted) return;
      setState(() {
        _results = [..._results, ...result.items];
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
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.navSearch)),
      body: Column(
        children: [
          _searchPanel(),
          Expanded(child: _buildResults()),
        ],
      ),
    );
  }

  Widget _searchPanel() {
    final l10n = AppLocalizations.of(context)!;
    final periodLabels = [
      l10n.allPeriods,
      l10n.lateSong,
      l10n.lateMing,
      l10n.lateQing,
      l10n.republic,
      l10n.other,
    ];
    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            TextField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                labelText: l10n.nameLabel,
                hintText: l10n.nameHint,
                prefixIcon: const Icon(Icons.search),
              ),
              onSubmitted: (_) => _search(),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _yearFromCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                        labelText: l10n.yearFrom, hintText: l10n.yearFromHint),
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
                    decoration: InputDecoration(
                        labelText: l10n.yearTo, hintText: l10n.yearToHint),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _eventCtrl,
              decoration: InputDecoration(labelText: l10n.eventKeyword),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _nativePlaceCtrl,
              decoration: InputDecoration(labelText: l10n.nativePlace),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  for (int i = 0; i < periodLabels.length; i++) ...[
                    ChoiceChip(
                      label: Text(periodLabels[i]),
                      selected: _selectedPeriod == i,
                      selectedColor: AppTheme.cinnabar.withValues(alpha: 0.5),
                      labelStyle: TextStyle(
                          color: _selectedPeriod == i ? AppTheme.paper : AppTheme.paperDim,
                          fontSize: 12),
                      side: BorderSide(
                          color: _selectedPeriod == i
                              ? AppTheme.cinnabarLight
                              : AppTheme.paperDim.withValues(alpha: 0.25)),
                      onSelected: (_) => setState(() => _selectedPeriod = i),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _loading ? null : _search,
                child: Text(_loading && !_loadingMore ? l10n.searching : l10n.searchButton),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResults() {
    final l10n = AppLocalizations.of(context)!;
    if (_loading && !_loadingMore) return const LoadingView();
    if (_error != null) return ErrorRetry(message: _error!, onRetry: _loadAll);
    if (_hasSearched && _results.isEmpty) {
      return EmptyView(text: l10n.noResults);
    }
    if (!_hasSearched && _results.isEmpty) {
      return EmptyView(text: l10n.noPublishedArchives);
    }
    return RefreshIndicator(
      color: AppTheme.bronzeLight,
      onRefresh: _loadAll,
      child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.all(16),
        itemCount: _results.length + (_loadingMore ? 1 : 0),
        itemBuilder: (_, i) {
          if (i >= _results.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator(color: AppTheme.bronzeLight)),
            );
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: TraitorCard(
              traitor: _results[i],
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => TraitorDetailScreen(traitorId: _results[i].id),
              )),
            ),
          );
        },
      ),
    );
  }
}