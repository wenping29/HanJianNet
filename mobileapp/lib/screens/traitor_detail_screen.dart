import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';

class TraitorDetailScreen extends StatefulWidget {
  final String traitorId;

  const TraitorDetailScreen({super.key, required this.traitorId});

  @override
  State<TraitorDetailScreen> createState() => _TraitorDetailScreenState();
}

class _TraitorDetailScreenState extends State<TraitorDetailScreen> {
  Traitor? _traitor;
  List<Revision>? _revisions;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
      _traitor = null;
      _revisions = null;
    });
    try {
      final t = await ApiClient.instance.getTraitor(widget.traitorId);
      List<Revision> revs = [];
      try {
        revs = await ApiClient.instance.getRevisions(widget.traitorId);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _traitor = t;
        _revisions = revs;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget body;
    if (_error != null) {
      body = ErrorRetry(message: _error!, onRetry: _load);
    } else if (_traitor == null) {
      body = const LoadingView();
    } else {
      body = RefreshIndicator(
        color: AppTheme.bronzeLight,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _header(_traitor!),
            _summary(_traitor!),
            if (_traitor!.lifeEvents.isNotEmpty) _lifeEvents(_traitor!),
            if (_traitor!.crimeRecords.isNotEmpty) _crimeRecords(_traitor!),
            if (_traitor!.spouses.isNotEmpty || _traitor!.children.isNotEmpty || _traitor!.residences.isNotEmpty)
              _family(_traitor!),
            if (_traitor!.attachments.any((a) => a.isPhoto)) _photos(_traitor!),
            if (_traitor!.attachments.any((a) => !a.isPhoto)) _evidences(_traitor!),
            if (_traitor!.sources.isNotEmpty) _sources(_traitor!),
            if (_revisions != null && _revisions!.isNotEmpty) _history(_revisions!),
            const SizedBox(height: 32),
          ],
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(_traitor?.name ?? '档案详情')),
      body: body,
    );
  }

  Widget _header(Traitor t) {
    final photo = t.photoUrl;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: Container(
                width: 96,
                height: 128,
                color: AppTheme.inkSoft,
                child: photo != null
                    ? Image.network(photo, fit: BoxFit.cover, errorBuilder: (_, _, _) => _initial(t.name))
                    : _initial(t.name),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(t.name,
                            style: const TextStyle(
                                fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 3, color: AppTheme.paper)),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.cinnabar.withValues(alpha: 0.7)),
                          borderRadius: BorderRadius.circular(3),
                          color: AppTheme.cinnabar.withValues(alpha: 0.15),
                        ),
                        child: Text(t.period, style: const TextStyle(fontSize: 11, color: AppTheme.cinnabarLight)),
                      ),
                    ],
                  ),
                  if (t.courtesyName != null || t.pseudonym != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Text(
                        [
                          if (t.courtesyName?.isNotEmpty == true) '字：${t.courtesyName}',
                          if (t.pseudonym?.isNotEmpty == true) '号：${t.pseudonym}',
                        ].join('　'),
                        style: TextStyle(fontSize: 12, letterSpacing: 1, color: AppTheme.paperDim),
                      ),
                    ),
                  const SizedBox(height: 10),
                  _kv('生卒', formatLifeSpan(t)),
                  _kv('籍贯', t.nativePlace.isEmpty ? '—' : t.nativePlace),
                  if (t.faction.isNotEmpty) _kv('派系', t.faction),
                  if (t.aliases.isNotEmpty) _kv('别名', t.aliases.join('、')),
                  if (t.identityTags.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [for (final tag in t.identityTags) Chip(label: Text(tag), visualDensity: VisualDensity.compact)],
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

  Widget _initial(String name) => Center(
        child: Text(name.isEmpty ? '？' : name.characters.first,
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppTheme.paperDim.withValues(alpha: 0.2))),
      );

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.only(top: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 44,
              child: Text(k, style: TextStyle(fontSize: 12, color: AppTheme.paperDim)),
            ),
            Expanded(child: Text(v, style: TextStyle(fontSize: 13, color: AppTheme.paper.withValues(alpha: 0.9)))),
          ],
        ),
      );

  Widget _summary(Traitor t) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: '人物概述', en: 'SUMMARY'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Text(t.summary.isEmpty ? '暂无概述' : t.summary,
                  style: TextStyle(height: 1.7, fontSize: 13.5, color: AppTheme.paper.withValues(alpha: 0.9))),
            ),
          ),
        ],
      );

  Widget _lifeEvents(Traitor t) {
    final events = [...t.lifeEvents]..sort((a, b) => (a.year ?? 0).compareTo(b.year ?? 0));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: '生平时间线', en: 'CHRONOLOGY'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                for (final (i, ev) in events.indexed)
                  IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(
                          width: 52,
                          child: Align(
                            alignment: Alignment.topCenter,
                            child: Text('${ev.year ?? '不详'}',
                                style: TextStyle(fontSize: 13, color: AppTheme.bronzeLight)),
                          ),
                        ),
                        Column(
                          children: [
                            Container(
                              width: 9,
                              height: 9,
                              margin: const EdgeInsets.only(top: 5),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: AppTheme.cinnabar, width: 2),
                                color: AppTheme.inkCard,
                              ),
                            ),
                            if (i < events.length - 1)
                              Expanded(
                                  child: Container(width: 1.5, color: AppTheme.cinnabar.withValues(alpha: 0.4))),
                          ],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(ev.event,
                                    style: TextStyle(
                                        fontSize: 13, height: 1.5, color: AppTheme.paper.withValues(alpha: 0.9))),
                                if (ev.sourceRef?.isNotEmpty == true)
                                  Text('出处：${ev.sourceRef}',
                                      style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.6))),
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
        ),
      ],
    );
  }

  Widget _crimeRecords(Traitor t) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: '犯罪记录', en: 'CRIMINAL RECORDS'),
          for (final c in t.crimeRecords)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Expanded(
                          child: Text(c.title,
                              style: const TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 1, color: AppTheme.cinnabarLight)),
                        ),
                        Text('${c.year ?? '不详'}',
                            style: TextStyle(fontSize: 15, color: AppTheme.bronzeLight)),
                      ],
                    ),
                    if (c.process?.isNotEmpty == true)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text('经过：${c.process}',
                            style: TextStyle(height: 1.6, fontSize: 12.5, color: AppTheme.paper.withValues(alpha: 0.85))),
                      ),
                    if (c.harm?.isNotEmpty == true)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text('危害：${c.harm}',
                            style: TextStyle(height: 1.6, fontSize: 12.5, color: AppTheme.paper.withValues(alpha: 0.85))),
                      ),
                    if (c.sourceRef?.isNotEmpty == true)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text('史料出处：${c.sourceRef}',
                            style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.6))),
                      ),
                  ],
                ),
              ),
            ),
        ],
      );

  Widget _family(Traitor t) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: '家族与居住', en: 'FAMILY'),
          if (t.spouses.isNotEmpty)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('配偶', style: TextStyle(fontSize: 12, letterSpacing: 2, color: AppTheme.cinnabarLight)),
                    const SizedBox(height: 8),
                    for (final s in t.spouses)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          s.remark?.isNotEmpty == true ? '${s.name}（${s.remark}）' : s.name,
                          style: TextStyle(fontSize: 13, color: AppTheme.paper.withValues(alpha: 0.9)),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          if (t.children.isNotEmpty)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('子女', style: TextStyle(fontSize: 12, letterSpacing: 2, color: AppTheme.cinnabarLight)),
                    const SizedBox(height: 8),
                    Table(
                      columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(1), 2: FlexColumnWidth(3)},
                      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                      children: [
                        TableRow(
                          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppTheme.cinnabar.withValues(alpha: 0.5)))),
                          children: [
                            _th('姓名'), _th('性别'), _th('去向'),
                          ],
                        ),
                        for (final c in t.children)
                          TableRow(
                            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppTheme.paperDim.withValues(alpha: 0.1)))),
                            children: [_td(c.name), _td(c.gender ?? '—'), _td(c.whereabouts ?? '—')],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          if (t.residences.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('居住地变迁', style: TextStyle(fontSize: 12, letterSpacing: 2, color: AppTheme.cinnabarLight)),
                    const SizedBox(height: 8),
                    for (final r in t.residences)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          [
                            r.period?.isNotEmpty == true ? '${r.period}：' : '',
                            r.place,
                            if (r.remark?.isNotEmpty == true) '（${r.remark}）',
                          ].join(),
                          style: TextStyle(fontSize: 13, color: AppTheme.paper.withValues(alpha: 0.9)),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      );

  Widget _th(String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Text(text, style: TextStyle(fontSize: 12, letterSpacing: 1, color: AppTheme.cinnabarLight)),
      );

  Widget _td(String text) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Text(text, style: TextStyle(fontSize: 12.5, color: AppTheme.paper.withValues(alpha: 0.9))),
      );

  Widget _photos(Traitor t) {
    final photos = t.attachments.where((a) => a.isPhoto).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: '人物照片', en: 'PHOTOGRAPHS'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 160,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 1,
          ),
          itemCount: photos.length,
          itemBuilder: (_, i) => GestureDetector(
            onTap: () => _showPhoto(photos[i]),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(photos[i].url, fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(color: AppTheme.inkSoft)),
                  if (photos[i].caption?.isNotEmpty == true)
                    Align(
                      alignment: Alignment.bottomLeft,
                      child: Container(
                        width: double.infinity,
                        color: Colors.black54,
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        child: Text(photos[i].caption!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 10, color: Colors.white)),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _showPhoto(Attachment a) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black87,
      builder: (_) => Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: Stack(
          children: [
            Center(
              child: InteractiveViewer(
                child: Image.network(a.url, fit: BoxFit.contain,
                    errorBuilder: (_, _, _) => const Icon(Icons.broken_image, color: Colors.white24, size: 64)),
              ),
            ),
            Positioned(
              top: 40,
              right: 16,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white70),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _evidences(Traitor t) {
    final evidences = t.attachments.where((a) => !a.isPhoto).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: '罪证材料', en: 'EVIDENCE'),
        Card(
          child: Column(
            children: [
              for (final (i, ev) in evidences.indexed) ...[
                if (i > 0) Divider(height: 1),
                ListTile(
                  leading: ev.fileType.startsWith('image')
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: Image.network(ev.url, width: 48, height: 48, fit: BoxFit.cover,
                              errorBuilder: (_, _, _) =>
                                  Container(width: 48, height: 48, color: AppTheme.inkSoft)),
                        )
                      : Container(
                          width: 48,
                          height: 48,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.paperDim.withValues(alpha: 0.2)),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text('文', style: TextStyle(fontSize: 18, color: AppTheme.bronzeLight)),
                        ),
                  title: Text(ev.caption?.isNotEmpty == true ? ev.caption! : '罪证材料',
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppTheme.paper)),
                  subtitle: Text(ev.fileType, style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7))),
                  trailing: Icon(Icons.open_in_new, size: 16, color: AppTheme.paperDim),
                  onTap: () {/* 移动端暂不内置文件预览 */},
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _sources(Traitor t) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: '史料来源', en: 'REFERENCES'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                for (final (i, s) in t.sources.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('[${i + 1}] ', style: TextStyle(fontSize: 12, color: AppTheme.bronzeLight)),
                        Expanded(
                          child: Text(s.citation,
                              style: TextStyle(height: 1.5, fontSize: 12.5, color: AppTheme.paper.withValues(alpha: 0.85))),
                        ),
                        if (s.credibility != null)
                          Text('★' * s.credibility! + '☆' * (5 - s.credibility!),
                              style: TextStyle(fontSize: 11, color: AppTheme.bronzeLight)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _history(List<Revision> revs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: '修改历史', en: 'REVISIONS'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                for (final r in revs.take(20))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        StatusChip(status: r.status),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.changeSummary,
                                  style: TextStyle(fontSize: 12.5, color: AppTheme.paper.withValues(alpha: 0.9))),
                              Text(
                                '${r.submitter?.username ?? r.submitterId} · ${formatDateTime(r.submittedAt)}'
                                '${r.reviewer != null ? ' · 审核：${r.reviewer!.username}' : ''}',
                                style: TextStyle(fontSize: 11, color: AppTheme.paperDim.withValues(alpha: 0.7)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                if (revs.isEmpty) const EmptyView(text: '暂无修改记录'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
