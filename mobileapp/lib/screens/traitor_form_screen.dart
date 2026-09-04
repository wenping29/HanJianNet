import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/session.dart';
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

class _TraitorFormScreenState extends State<TraitorFormScreen> {
  final _nameCtrl = TextEditingController();
  final _changeSummaryCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    if (widget.mode == TraitorFormMode.edit && widget.traitor != null) {
      final t = widget.traitor!;
      _nameCtrl.text = t.name;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _changeSummaryCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!Session.instance.isLogin) {
      return Scaffold(
        appBar: AppBar(title: const Text('编辑档案')),
        body: const Center(
          child: Text('请先登录', style: TextStyle(color: AppTheme.paperDim)),
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.mode == TraitorFormMode.create ? '提交新档案' : '修改档案'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: '姓名 *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? '请输入姓名' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _changeSummaryCtrl,
              decoration: const InputDecoration(labelText: '修改说明 *'),
              maxLines: 3,
              validator: (v) => (v == null || v.trim().isEmpty) ? '请输入修改说明' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submit,
              child: const Text('提 交'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('P1 阶段实现提交功能')),
    );
  }
}
