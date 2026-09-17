import 'package:flutter/material.dart';

import 'package:image_picker/image_picker.dart';

import 'package:hanjian_mobileapp/l10n/app_localizations.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../widgets/common.dart';
import '../widgets/theme.dart';

enum TraitorFormMode { create, edit }

class TraitorFormScreen extends StatefulWidget {
  final TraitorFormMode mode;
  final Traitor? traitor;

  const TraitorFormScreen({
    super.key,
    required this.mode,
    this.traitor,
  });

  @override
  State<TraitorFormScreen> createState() => _TraitorFormScreenState();
}

// ---- 可编辑行（每条动态记录一组输入控制器） ----

class _SpouseRow {
  final name = TextEditingController();
  final remark = TextEditingController();
  void dispose() {
    name.dispose();
    remark.dispose();
  }
}

class _ChildRow {
  final name = TextEditingController();
  final gender = TextEditingController();
  final whereabouts = TextEditingController();
  final remark = TextEditingController();
  void dispose() {
    name.dispose();
    gender.dispose();
    whereabouts.dispose();
    remark.dispose();
  }
}

class _ResidenceRow {
  final place = TextEditingController();
  final period = TextEditingController();
  final remark = TextEditingController();
  void dispose() {
    place.dispose();
    period.dispose();
    remark.dispose();
  }
}

class _CrimeRow {
  final year = TextEditingController();
  final title = TextEditingController();
  final process = TextEditingController();
  final harm = TextEditingController();
  final sourceRef = TextEditingController();
  void dispose() {
    year.dispose();
    title.dispose();
    process.dispose();
    harm.dispose();
    sourceRef.dispose();
  }
}

class _LifeEventRow {
  final year = TextEditingController();
  final event = TextEditingController();
  final sourceRef = TextEditingController();
  void dispose() {
    year.dispose();
    event.dispose();
    sourceRef.dispose();
  }
}

class _SourceRow {
  final citation = TextEditingController();
  final credibility = TextEditingController();
  void dispose() {
    citation.dispose();
    credibility.dispose();
  }
}

class _AttachmentRow {
  final String id;
  final String url;
  final String kind;
  final String fileType;
  final caption = TextEditingController();

  _AttachmentRow({
    required this.id,
    required this.url,
    required this.kind,
    required this.fileType,
    String captionText = '',
  }) {
    caption.text = captionText;
  }

  void dispose() => caption.dispose();
}

class _TraitorFormScreenState extends State<TraitorFormScreen> {
  static const _yearTypes = ['exact', 'approx', 'before', 'after', 'unknown'];

  final _formKey = GlobalKey<FormState>();

  final _nameCtrl = TextEditingController();
  final _birthYearCtrl = TextEditingController();
  final _deathYearCtrl = TextEditingController();
  final _nativePlaceCtrl = TextEditingController();
  final _birthPlaceCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _tagsCtrl = TextEditingController();
  final _summaryCtrl = TextEditingController();
  final _changeSummaryCtrl = TextEditingController();

  String _birthYearType = 'unknown';
  String _deathYearType = 'unknown';

  final List<_SpouseRow> _spouses = [];
  final List<_ChildRow> _children = [];
  final List<_ResidenceRow> _residences = [];
  final List<_CrimeRow> _crimes = [];
  final List<_LifeEventRow> _lifeEvents = [];
  final List<_SourceRow> _sources = [];
  final List<_AttachmentRow> _attachments = [];

  bool _busy = false;
  bool _uploading = false;
  String? _error;

  bool get _isEdit => widget.mode == TraitorFormMode.edit;

  @override
  void initState() {
    super.initState();
    final t = widget.traitor;
    if (_isEdit && t != null) {
      _nameCtrl.text = t.name;
      _birthYearCtrl.text = t.birthYear?.toString() ?? '';
      _deathYearCtrl.text = t.deathYear?.toString() ?? '';
      _birthYearType = _yearTypes.contains(t.birthYearType) ? t.birthYearType : 'unknown';
      _deathYearType = _yearTypes.contains(t.deathYearType) ? t.deathYearType : 'unknown';
      _nativePlaceCtrl.text = t.nativePlace;
      _birthPlaceCtrl.text = t.birthPlace;
      _titleCtrl.text = t.title ?? '';
      _tagsCtrl.text = t.identityTags.join('，');
      _summaryCtrl.text = t.summary;
      for (final s in t.spouses) {
        final row = _SpouseRow();
        row.name.text = s.name;
        row.remark.text = s.remark ?? '';
        _spouses.add(row);
      }
      for (final c in t.children) {
        final row = _ChildRow();
        row.name.text = c.name;
        row.gender.text = c.gender ?? '';
        row.whereabouts.text = c.whereabouts ?? '';
        row.remark.text = c.remark ?? '';
        _children.add(row);
      }
      for (final r in t.residences) {
        final row = _ResidenceRow();
        row.place.text = r.place;
        row.period.text = r.period ?? '';
        row.remark.text = r.remark ?? '';
        _residences.add(row);
      }
      for (final c in t.crimeRecords) {
        final row = _CrimeRow();
        row.year.text = c.year?.toString() ?? '';
        row.title.text = c.title;
        row.process.text = c.process ?? '';
        row.harm.text = c.harm ?? '';
        row.sourceRef.text = c.sourceRef ?? '';
        _crimes.add(row);
      }
      for (final e in t.lifeEvents) {
        final row = _LifeEventRow();
        row.year.text = e.year?.toString() ?? '';
        row.event.text = e.event;
        row.sourceRef.text = e.sourceRef ?? '';
        _lifeEvents.add(row);
      }
      for (final s in t.sources) {
        final row = _SourceRow();
        row.citation.text = s.citation;
        row.credibility.text = s.credibility?.toString() ?? '';
        _sources.add(row);
      }
      for (final a in t.attachments) {
        _attachments.add(_AttachmentRow(
          id: a.id,
          url: a.url,
          kind: a.kind,
          fileType: a.fileType,
          captionText: a.caption ?? '',
        ));
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _birthYearCtrl.dispose();
    _deathYearCtrl.dispose();
    _nativePlaceCtrl.dispose();
    _birthPlaceCtrl.dispose();
    _titleCtrl.dispose();
    _tagsCtrl.dispose();
    _summaryCtrl.dispose();
    _changeSummaryCtrl.dispose();
    for (final r in _spouses) {
      r.dispose();
    }
    for (final r in _children) {
      r.dispose();
    }
    for (final r in _residences) {
      r.dispose();
    }
    for (final r in _crimes) {
      r.dispose();
    }
    for (final r in _lifeEvents) {
      r.dispose();
    }
    for (final r in _sources) {
      r.dispose();
    }
    for (final r in _attachments) {
      r.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (!Session.instance.isLogin) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.editArchive)),
        body: Center(
          child: Text(l10n.pleaseLoginFirst, style: TextStyle(color: AppTheme.paperDim)),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.mode == TraitorFormMode.create ? l10n.submitNewArchive : l10n.modifyArchive),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _basicInfo(l10n),
            _lifeEventsSection(l10n),
            _spousesSection(l10n),
            _childrenSection(l10n),
            _crimesSection(l10n),
            _residencesSection(l10n),
            _attachmentsSection(l10n, 'photo'),
            _attachmentsSection(l10n, 'evidence'),
            _sourcesSection(l10n),
            _changeSummarySection(l10n),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: AppTheme.cinnabarLight, fontSize: 13)),
              ),
            FilledButton(
              onPressed: (_busy || _uploading) ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(l10n.submitButton),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  // ---- 区块 ----

  Widget _section(String title, {String en = '', required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 8),
          child: SectionHeader(title: title, en: en),
        ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _basicInfo(AppLocalizations l10n) {
    return _section(
      l10n.basicInfo,
      en: 'BASIC',
      children: [
        _field(l10n.nameRequired, _nameCtrl,
            validator: (v) => (v == null || v.trim().isEmpty) ? l10n.nameInput : null),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _field(l10n.birthYearLabel, _birthYearCtrl, keyboardType: TextInputType.number),
            ),
            const SizedBox(width: 8),
            SizedBox(width: 110, child: _yearTypeField(_birthYearType, (v) => setState(() => _birthYearType = v))),
          ],
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _field(l10n.deathYearLabel, _deathYearCtrl, keyboardType: TextInputType.number),
            ),
            const SizedBox(width: 8),
            SizedBox(width: 110, child: _yearTypeField(_deathYearType, (v) => setState(() => _deathYearType = v))),
          ],
        ),
        _field(l10n.nativePlaceDetail, _nativePlaceCtrl),
        _field(l10n.birthPlaceLabel, _birthPlaceCtrl),
        _field(l10n.officialTitleLabel, _titleCtrl),
        _field(l10n.tagsLabel, _tagsCtrl, hint: l10n.tagsHint),
        _field(l10n.summaryTitle, _summaryCtrl,
            maxLines: 8,
            validator: (v) => (v == null || v.trim().isEmpty) ? l10n.summaryRequired : null),
      ],
    );
  }

  Widget _lifeEventsSection(AppLocalizations l10n) {
    return _section(
      l10n.timeline,
      en: 'LIFE EVENTS',
      children: [
        for (final (i, r) in _lifeEvents.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _lifeEvents.removeAt(i);
            }),
            children: [
              _field(l10n.rowYear, r.year, keyboardType: TextInputType.number),
              _field(l10n.rowEvent, r.event, maxLines: 3),
              _field(l10n.rowSourceRef, r.sourceRef),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _lifeEvents.add(_LifeEventRow()))),
      ],
    );
  }

  Widget _spousesSection(AppLocalizations l10n) {
    return _section(
      l10n.spouse,
      en: 'SPOUSES',
      children: [
        for (final (i, r) in _spouses.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _spouses.removeAt(i);
            }),
            children: [
              _field(l10n.nameLabel, r.name),
              _field(l10n.rowRemark, r.remark),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _spouses.add(_SpouseRow()))),
      ],
    );
  }

  Widget _childrenSection(AppLocalizations l10n) {
    return _section(
      l10n.children,
      en: 'CHILDREN',
      children: [
        for (final (i, r) in _children.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _children.removeAt(i);
            }),
            children: [
              _field(l10n.nameLabel, r.name),
              _field(l10n.genderLabel, r.gender),
              _field(l10n.whereabouts, r.whereabouts),
              _field(l10n.rowRemark, r.remark),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _children.add(_ChildRow()))),
      ],
    );
  }

  Widget _crimesSection(AppLocalizations l10n) {
    return _section(
      l10n.criminalRecords,
      en: 'CRIMES',
      children: [
        for (final (i, r) in _crimes.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _crimes.removeAt(i);
            }),
            children: [
              _field(l10n.rowYear, r.year, keyboardType: TextInputType.number),
              _field(l10n.rowTitle, r.title),
              _field(l10n.rowProcess, r.process, maxLines: 3),
              _field(l10n.rowHarm, r.harm, maxLines: 3),
              _field(l10n.rowSourceRef, r.sourceRef),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _crimes.add(_CrimeRow()))),
      ],
    );
  }

  Widget _residencesSection(AppLocalizations l10n) {
    return _section(
      l10n.residenceChanges,
      en: 'RESIDENCES',
      children: [
        for (final (i, r) in _residences.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _residences.removeAt(i);
            }),
            children: [
              _field(l10n.rowPlace, r.place),
              _field(l10n.rowPeriod, r.period),
              _field(l10n.rowRemark, r.remark),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _residences.add(_ResidenceRow()))),
      ],
    );
  }

  /// 照片（kind=photo）与罪证（kind=evidence）附件区块。
  Widget _attachmentsSection(AppLocalizations l10n, String kind) {
    final items = _attachments.where((a) => a.kind == kind).toList();
    final isPhoto = kind == 'photo';
    return _section(
      isPhoto ? l10n.photos : l10n.evidence,
      en: isPhoto ? 'PHOTOS' : 'EVIDENCE',
      children: [
        for (final a in items)
          _rowCard(
            onDelete: () => setState(() {
              a.dispose();
              _attachments.remove(a);
            }),
            children: [
              if (_isImageAttachment(a))
                Align(
                  alignment: Alignment.centerLeft,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(3),
                    child: Image.network(
                      resolveAssetUrl(a.url),
                      width: 96,
                      height: 96,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        width: 96,
                        height: 96,
                        color: AppTheme.inkSoft,
                        alignment: Alignment.center,
                        child: Text(a.fileType, style: TextStyle(color: AppTheme.paperDim, fontSize: 11)),
                      ),
                    ),
                  ),
                )
              else
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(a.url.split('/').last,
                      style: TextStyle(color: AppTheme.paperDim, fontSize: 12)),
                ),
              const SizedBox(height: 8),
              _field(l10n.rowCaption, a.caption),
            ],
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: OutlinedButton.icon(
            onPressed: _uploading ? null : () => _pickAndUpload(kind),
            icon: _uploading
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.upload, size: 16),
            label: Text(_uploading ? l10n.uploading : (isPhoto ? l10n.uploadPhoto : l10n.uploadEvidence)),
          ),
        ),
      ],
    );
  }

  Widget _sourcesSection(AppLocalizations l10n) {
    return _section(
      l10n.sources,
      en: 'REFERENCES',
      children: [
        for (final (i, r) in _sources.indexed)
          _rowCard(
            onDelete: () => setState(() {
              r.dispose();
              _sources.removeAt(i);
            }),
            children: [
              _field(l10n.rowCitation, r.citation, maxLines: 2),
              _field(l10n.rowCredibility, r.credibility, keyboardType: TextInputType.number),
            ],
          ),
        _addButton(l10n.addItem, () => setState(() => _sources.add(_SourceRow()))),
      ],
    );
  }

  Widget _changeSummarySection(AppLocalizations l10n) {
    return _section(
      l10n.changeDescription,
      en: 'CHANGE SUMMARY',
      children: [
        _field(l10n.changeDescription, _changeSummaryCtrl,
            maxLines: 3,
            validator: (v) => (v == null || v.trim().isEmpty) ? l10n.changeDescriptionInput : null),
      ],
    );
  }

  // ---- 小部件 ----

  Widget _field(
    String label,
    TextEditingController ctrl, {
    int maxLines = 1,
    TextInputType? keyboardType,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: validator,
        decoration: InputDecoration(labelText: label, hintText: hint, isDense: true),
      ),
    );
  }

  String _yearTypeLabel(AppLocalizations l10n, String v) => switch (v) {
        'exact' => l10n.yearExact,
        'approx' => l10n.circa,
        'before' => l10n.before,
        'after' => l10n.after,
        _ => l10n.unknown,
      };

  Widget _yearTypeField(String value, ValueChanged<String> onChanged) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: DropdownButtonFormField<String>(
        initialValue: value,
        isDense: true,
        decoration: const InputDecoration(isDense: true),
        items: [
          for (final v in _yearTypes)
            DropdownMenuItem(value: v, child: Text(_yearTypeLabel(l10n, v))),
        ],
        onChanged: (v) {
          if (v != null) onChanged(v);
        },
      ),
    );
  }

  Widget _rowCard({required VoidCallback onDelete, required List<Widget> children}) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(10, 4, 10, 10),
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.paperDim.withValues(alpha: 0.15)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onDelete,
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.cinnabarLight,
                visualDensity: VisualDensity.compact,
              ),
              icon: const Icon(Icons.close, size: 14),
              label: Text(l10n.deleteItem, style: const TextStyle(fontSize: 12)),
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _addButton(String label, VoidCallback onAdd) {
    return Align(
      alignment: Alignment.centerLeft,
      child: TextButton.icon(
        onPressed: onAdd,
        icon: const Icon(Icons.add, size: 16),
        label: Text(label),
      ),
    );
  }

  // ---- 上传 ----

  /// 附件是否可按图片预览：fileType 可能是扩展名（.webp）或 MIME（image/png）。
  bool _isImageAttachment(_AttachmentRow a) {
    if (a.fileType.startsWith('image')) return true;
    const imgExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif'];
    return imgExts.contains(a.fileType.toLowerCase());
  }

  Future<void> _pickAndUpload(String kind) async {
    final files = await ImagePicker().pickMultiImage();
    if (files.isEmpty || !mounted) return;
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      for (final f in files) {
        final bytes = await f.readAsBytes();
        final res = await ApiClient.instance
            .uploadBytes(bytes: bytes, filename: f.name, kind: kind);
        if (!mounted) return;
        setState(() {
          _attachments.add(_AttachmentRow(
            id: (res['id'] as String?) ?? '',
            url: (res['url'] as String?) ?? '',
            kind: (res['kind'] as String?) ?? kind,
            fileType: (res['fileType'] as String?) ?? '',
          ));
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  // ---- 提交 ----

  List<String> _splitTags(String text) => text
      .split(RegExp('[，,]'))
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();

  int? _parseInt(String text) => int.tryParse(text.trim());

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final l10n = AppLocalizations.of(context)!;
    setState(() {
      _busy = true;
      _error = null;
    });

    final t = widget.traitor;
    String? nullIfEmpty(String s) => s.trim().isEmpty ? null : s.trim();

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      // 未在本表单维护的字段：编辑时透传原值，避免被置空
      if (t?.courtesyName != null) 'courtesyName': t!.courtesyName,
      if (t?.pseudonym != null) 'pseudonym': t!.pseudonym,
      'birthYear': _parseInt(_birthYearCtrl.text),
      'deathYear': _parseInt(_deathYearCtrl.text),
      'birthYearType': _birthYearType,
      'deathYearType': _deathYearType,
      'nativePlace': _nativePlaceCtrl.text.trim(),
      'birthPlace': _birthPlaceCtrl.text.trim(),
      'province': t?.province ?? '',
      'aliases': t?.aliases ?? const <String>[],
      'identityTags': _splitTags(_tagsCtrl.text),
      'period': t?.period ?? '',
      'faction': t?.faction ?? '',
      'summary': _summaryCtrl.text.trim(),
      'title': _titleCtrl.text.trim(),
      'spouses': [
        for (final r in _spouses)
          if (r.name.text.trim().isNotEmpty)
            {'name': r.name.text.trim(), if (nullIfEmpty(r.remark.text) != null) 'remark': r.remark.text.trim()},
      ],
      'children': [
        for (final r in _children)
          if (r.name.text.trim().isNotEmpty)
            {
              'name': r.name.text.trim(),
              if (nullIfEmpty(r.gender.text) != null) 'gender': r.gender.text.trim(),
              if (nullIfEmpty(r.whereabouts.text) != null) 'whereabouts': r.whereabouts.text.trim(),
              if (nullIfEmpty(r.remark.text) != null) 'remark': r.remark.text.trim(),
            },
      ],
      'residences': [
        for (final r in _residences)
          if (r.place.text.trim().isNotEmpty)
            {
              'place': r.place.text.trim(),
              if (nullIfEmpty(r.period.text) != null) 'period': r.period.text.trim(),
              if (nullIfEmpty(r.remark.text) != null) 'remark': r.remark.text.trim(),
            },
      ],
      'crimeRecords': [
        for (final r in _crimes)
          if (r.title.text.trim().isNotEmpty)
            {
              'title': r.title.text.trim(),
              'year': _parseInt(r.year.text),
              if (nullIfEmpty(r.process.text) != null) 'process': r.process.text.trim(),
              if (nullIfEmpty(r.harm.text) != null) 'harm': r.harm.text.trim(),
              if (nullIfEmpty(r.sourceRef.text) != null) 'sourceRef': r.sourceRef.text.trim(),
            },
      ],
      'lifeEvents': [
        for (final r in _lifeEvents)
          if (r.event.text.trim().isNotEmpty)
            {
              'event': r.event.text.trim(),
              'year': _parseInt(r.year.text),
              if (nullIfEmpty(r.sourceRef.text) != null) 'sourceRef': r.sourceRef.text.trim(),
            },
      ],
      'attachments': [
        for (final a in _attachments)
          {
            'id': a.id,
            'url': a.url,
            'kind': a.kind,
            'fileType': a.fileType,
            if (nullIfEmpty(a.caption.text) != null) 'caption': a.caption.text.trim(),
          },
      ],
      'sources': [
        for (final r in _sources)
          if (r.citation.text.trim().isNotEmpty)
            {
              'citation': r.citation.text.trim(),
              'credibility': _parseInt(r.credibility.text),
            },
      ],
      'relatedIds': t?.relatedIds ?? const <String>[],
      'changeSummary': _changeSummaryCtrl.text.trim(),
    };

    try {
      if (_isEdit && t != null) {
        await ApiClient.instance.updateTraitor(t.id, payload);
      } else {
        await ApiClient.instance.createTraitor(payload);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.submitSuccess)));
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _busy = false;
      });
    }
  }
}
